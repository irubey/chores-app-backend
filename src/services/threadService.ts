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
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { HouseholdRole, ThreadAction } from "@shared/enums";
import { verifyMembership } from "./authService";
import {
  transformThread,
  transformThreadWithMessages,
  transformThreadWithParticipants,
} from "../utils/transformers/messageTransformer";
import {
  PrismaThreadWithMessagesAndParticipants,
  PrismaThreadWithParticipantsOnly,
} from "../utils/transformers/transformerPrismaTypes";
import logger from "../utils/logger";
import {
  wrapResponse,
  handleServiceError,
  emitThreadEvent,
} from "../utils/servicesUtils";

/**
 * Retrieves all threads for a specific household.
 */
export async function getThreads(
  householdId: string,
  userId: string
): Promise<ApiResponse<ThreadWithMessages[]>> {
  logger.debug("Fetching threads for household", { householdId, userId });

  try {
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

    logger.info("Successfully retrieved threads", {
      householdId,
      threadCount: threads.length,
    });

    return wrapResponse(
      threads.map((thread) =>
        transformThreadWithMessages(
          thread as PrismaThreadWithMessagesAndParticipants
        )
      )
    );
  } catch (error) {
    return handleServiceError(error, "fetch threads", { householdId }) as never;
  }
}

/**
 * Creates a new thread.
 */
export async function createThread(
  data: CreateThreadDTO,
  userId: string
): Promise<ApiResponse<ThreadWithParticipants>> {
  logger.debug("Creating new thread", {
    householdId: data.householdId,
    userId,
  });

  try {
    const thread = await prisma.$transaction(async (tx) => {
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
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

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
        });
      }

      return newThread;
    });

    logger.info("Successfully created thread", {
      threadId: thread.id,
      householdId: data.householdId,
    });

    const transformedThread = transformThreadWithParticipants(
      thread as PrismaThreadWithParticipantsOnly
    );

    emitThreadEvent("thread_update", thread.id, data.householdId, {
      action: ThreadAction.CREATED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    return handleServiceError(error, "create thread") as never;
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
  logger.debug("Fetching thread by ID", { householdId, threadId, userId });

  try {
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
            attachments: true,
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
      logger.warn("Thread not found", { threadId });
      throw new NotFoundError("Thread not found");
    }

    logger.info("Successfully retrieved thread", { threadId });

    return wrapResponse(
      transformThreadWithMessages(
        thread as PrismaThreadWithMessagesAndParticipants
      )
    );
  } catch (error) {
    return handleServiceError(error, "fetch thread by ID", {
      threadId,
    }) as never;
  }
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
  logger.debug("Updating thread", { householdId, threadId, userId });

  try {
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
    });

    logger.info("Successfully updated thread", { threadId });

    const transformedThread = transformThread(updatedThread);

    emitThreadEvent("thread_update", threadId, householdId, {
      action: ThreadAction.UPDATED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    return handleServiceError(error, "update thread", { threadId }) as never;
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
  logger.debug("Deleting thread", { householdId, threadId, userId });

  try {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

    await prisma.thread.delete({ where: { id: threadId } });

    logger.info("Successfully deleted thread", { threadId });

    emitThreadEvent("thread_update", threadId, householdId, {
      action: ThreadAction.DELETED,
      threadId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, "delete thread", { threadId }) as never;
  }
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
  logger.debug("Inviting users to thread", {
    householdId,
    threadId,
    userIds: data.userIds,
    requestingUserId: userId,
  });

  try {
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

    logger.info("Successfully invited users to thread", {
      threadId,
      invitedUserCount: data.userIds.length,
    });

    const transformedThread = transformThreadWithParticipants(
      updatedThread as PrismaThreadWithParticipantsOnly
    );

    emitThreadEvent("thread_update", threadId, householdId, {
      action: ThreadAction.USERS_INVITED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    return handleServiceError(error, "invite users to thread", {
      threadId,
    }) as never;
  }
}
