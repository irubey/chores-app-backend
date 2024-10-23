import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import prisma from "../config/database";
import {
  CreateThreadDTO,
  Thread,
  ThreadWithMessages,
  ThreadWithParticipants,
  UpdateThreadDTO,
  InviteUsersDTO,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { HouseholdRole, ThreadAction } from "@shared/enums";
import { getIO } from "../sockets";
import { verifyMembership } from "./authService";
import {
  transformThread,
  transformThreadWithMessages,
  transformThreadWithParticipants,
} from "../utils/transformers/messageTransformer";
import {
  PrismaThreadWithMessagesAndParticipants,
  PrismaThreadWithParticipantsOnly,
  PrismaThreadWithFullRelations,
  PrismaThreadBase,
} from "../utils/transformers/transformerPrismaTypes";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Retrieves all threads for a specific household.
 */
export async function getThreads(
  householdId: string,
  userId: string
): Promise<ApiResponse<ThreadWithMessages[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const threads = await prisma.thread.findMany({
    where: { householdId },
    include: {
      messages: {
        include: {
          thread: true,
          author: true,
          attachments: {
            include: {
              message: true,
            },
          },
          reactions: {
            include: {
              user: true,
              message: true,
            },
          },
          mentions: {
            include: {
              user: true,
              message: true,
            },
          },
          reads: {
            include: {
              user: true,
              message: true,
            },
          },
        },
      },
      participants: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const transformedThreads = threads.map((thread) =>
    transformThreadWithMessages(
      thread as PrismaThreadWithMessagesAndParticipants
    )
  );

  return wrapResponse(transformedThreads);
}

/**
 * Creates a new thread.
 */
export async function createThread(
  data: CreateThreadDTO
): Promise<ApiResponse<ThreadWithParticipants>> {
  const thread = await prisma.thread.create({
    data: {
      householdId: data.householdId,
      authorId: data.authorId,
      title: data.title,
      participants: {
        connect: data.participants.map((userId) => ({
          userId_householdId: {
            userId,
            householdId: data.householdId,
          },
        })),
      },
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  const transformedThread = transformThreadWithParticipants(
    thread as PrismaThreadWithParticipantsOnly
  );

  getIO().to(`household_${data.householdId}`).emit("thread_update", {
    action: ThreadAction.CREATED,
    thread: transformedThread,
  });

  return wrapResponse(transformedThread);
}

/**
 * Retrieves details of a specific thread.
 */
export async function getThreadById(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<ThreadWithMessages>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: {
        include: {
          thread: true,
          author: true,
          attachments: {
            include: {
              message: true,
            },
          },
          reactions: {
            include: {
              user: true,
              message: true,
            },
          },
          mentions: {
            include: {
              user: true,
              message: true,
            },
          },
          reads: {
            include: {
              user: true,
              message: true,
            },
          },
        },
      },
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  const transformedThread = transformThreadWithMessages(
    thread as PrismaThreadWithMessagesAndParticipants
  );

  return wrapResponse(transformedThread);
}

/**
 * Updates an existing thread.
 */
export async function updateThread(
  householdId: string,
  threadId: string,
  data: UpdateThreadDTO,
  userId: string
): Promise<ApiResponse<Thread>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data: {
      title: data.title,
    },
  });

  const transformedThread = transformThread(updatedThread as PrismaThreadBase);

  getIO().to(`household_${householdId}`).emit("thread_update", {
    action: ThreadAction.UPDATED,
    thread: transformedThread,
  });

  return wrapResponse(transformedThread);
}

/**
 * Deletes a thread.
 */
export async function deleteThread(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.thread.delete({ where: { id: threadId } });

  getIO().to(`household_${householdId}`).emit("thread_update", {
    action: ThreadAction.DELETED,
    threadId,
  });

  return wrapResponse(undefined);
}

/**
 * Invites users to a thread.
 */
export async function inviteUsersToThread(
  householdId: string,
  threadId: string,
  data: InviteUsersDTO,
  userId: string
): Promise<ApiResponse<ThreadWithParticipants>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const updatedThread = await prisma.$transaction(async (tx) => {
    const householdMembers = await tx.householdMember.findMany({
      where: {
        householdId,
        userId: { in: data.userIds },
      },
    });

    if (householdMembers.length !== data.userIds.length) {
      throw new UnauthorizedError(
        "Some users are not members of this household"
      );
    }

    return tx.thread.update({
      where: { id: threadId },
      data: {
        participants: {
          connect: data.userIds.map((userId) => ({
            userId_householdId: {
              userId,
              householdId,
            },
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  });

  const transformedThread = transformThreadWithParticipants(
    updatedThread as PrismaThreadWithParticipantsOnly
  );

  getIO().to(`household_${householdId}`).emit("thread_update", {
    action: ThreadAction.USERS_INVITED,
    thread: transformedThread,
  });

  return wrapResponse(transformedThread);
}
