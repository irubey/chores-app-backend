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
} from "../utils/transformers/messageTransformer/messageTransformer";
import {
  PrismaThreadWithMessagesAndParticipants,
  PrismaThreadWithParticipantsOnly,
  PrismaThreadWithFullRelations,
  PrismaThreadBase,
} from "../utils/transformers/transformerPrismaTypes";
import logger from "../utils/logger";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Create a consistent include object for threads
const threadInclude = {
  author: {
    select: {
      id: true,
      email: true,
      name: true,
      profileImageURL: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  },
  household: {
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      currency: true,
      icon: true,
      timezone: true,
      language: true,
    },
  },
  messages: {
    include: {
      thread: true,
      author: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
      attachments: {
        include: {
          message: {
            select: {
              id: true,
              threadId: true,
            },
          },
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              profileImageURL: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
          message: {
            include: {
              thread: true,
            },
          },
        },
      },
      mentions: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              profileImageURL: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
          message: {
            include: {
              thread: true,
            },
          },
        },
      },
      reads: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              profileImageURL: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
          message: {
            include: {
              thread: true,
            },
          },
        },
      },
    },
  },
  participants: {
    include: {
      user: true,
    },
  },
} as const;

/**
 * Retrieves all threads for a specific household.
 */
export async function getThreads(
  householdId: string,
  userId: string
): Promise<ApiResponse<ThreadWithMessages[]>> {
  try {
    logger.info(`Fetching threads for household ${householdId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const threads = await prisma.thread.findMany({
      where: { householdId },
      include: threadInclude,
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
  } catch (error) {
    logger.error(`Error fetching threads: ${error}`);
    throw error;
  }
}

/**
 * Creates a new thread.
 */
export async function createThread(
  data: CreateThreadDTO,
  userId: string
): Promise<ApiResponse<ThreadWithParticipants>> {
  try {
    logger.info(`Creating new thread in household ${data.householdId}`);

    const thread = await prisma.$transaction(async (tx) => {
      // Create the thread first
      const newThread = await tx.thread.create({
        data: {
          householdId: data.householdId,
          title: data.title,
          authorId: userId,
          participants: {
            connect: data.participants.map((userId) => ({
              userId_householdId: {
                userId,
                householdId: data.householdId,
              },
            })),
          },
        },
        include: threadInclude,
      });

      // If there's an initial message, create it with proper typing
      if (data.initialMessage) {
        await tx.message.create({
          data: {
            threadId: newThread.id,
            content: data.initialMessage.content,
            authorId: userId,
            ...(data.initialMessage.attachments && {
              attachments: {
                create: data.initialMessage.attachments.map((attachment) => ({
                  url: attachment.url,
                  fileType: attachment.fileType,
                })),
              },
            }),
            ...(data.initialMessage.mentions && {
              mentions: {
                create: data.initialMessage.mentions.map((userId) => ({
                  userId,
                  mentionedAt: new Date(),
                })),
              },
            }),
          },
          include: {
            thread: true,
            author: true,
            attachments: true,
            mentions: {
              include: {
                user: true,
              },
            },
          },
        });
      }

      return newThread;
    });

    const transformedThread = transformThreadWithParticipants(
      thread as PrismaThreadWithParticipantsOnly
    );

    getIO().to(`household_${data.householdId}`).emit("thread_update", {
      action: ThreadAction.CREATED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    logger.error(`Error creating thread: ${error}`);
    throw error;
  }
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
  try {
    logger.info(`Updating thread ${threadId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        title: data.title,
        ...(data.participants && {
          participants: {
            connect: data.participants.add?.map((userId) => ({
              userId_householdId: { userId, householdId },
            })),
            disconnect: data.participants.remove?.map((userId) => ({
              userId_householdId: { userId, householdId },
            })),
          },
        }),
      },
      include: threadInclude,
    });

    const transformedThread = transformThread(
      updatedThread as PrismaThreadBase
    );

    getIO().to(`household_${householdId}`).emit("thread_update", {
      action: ThreadAction.UPDATED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    logger.error(`Error updating thread: ${error}`);
    throw error;
  }
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
