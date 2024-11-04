import {
  NotFoundError,
  UnauthorizedError,
} from "../../middlewares/errorHandler";
import prisma from "../../config/database";
import logger from "../../utils/logger";
import { getIO } from "../../sockets";
import { verifyMembership } from "../authService";
import {
  transformMessage,
  transformMessageWithDetails,
} from "../../utils/transformers/messageTransformer/messageTransformer";
import {
  CreateMessageDTO,
  UpdateMessageDTO,
  Message,
  MessageWithDetails,
  MessageReadStatus,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { PaginationOptions } from "@shared/interfaces/pagination";
import { HouseholdRole, MessageAction } from "@shared/enums";
import { PrismaMessageWithFullRelations } from "../../utils/transformers/transformerPrismaTypes";

/**
 * Get messages for a thread with pagination
 */
export async function getMessages(
  householdId: string,
  threadId: string,
  userId: string,
  options: PaginationOptions = {}
): Promise<ApiResponse<MessageWithDetails[]>> {
  try {
    logger.info(`Fetching messages for thread ${threadId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const limit = options.limit || 50;
    const cursor = options.cursor;

    const messages = await prisma.message.findMany({
      where: {
        threadId,
        ...(cursor && {
          createdAt: {
            lt: new Date(cursor),
          },
        }),
      },
      take: limit + 1,
      orderBy: {
        createdAt: "desc",
      },
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
    });

    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore
      ? messages[limit].createdAt.toISOString()
      : undefined;

    const transformedMessages = paginatedMessages.map((msg) =>
      transformMessageWithDetails(msg as PrismaMessageWithFullRelations)
    );

    return {
      data: transformedMessages,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  } catch (error) {
    logger.error(`Error fetching messages: ${error}`);
    throw error;
  }
}

/**
 * Create a new message
 */
export async function createMessage(
  householdId: string,
  threadId: string,
  data: CreateMessageDTO,
  userId: string
): Promise<ApiResponse<MessageWithDetails>> {
  try {
    logger.info(`Creating message in thread ${threadId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          threadId,
          authorId: userId,
          content: data.content,
        },
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
      });

      // Update thread's updatedAt timestamp
      await tx.thread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      return newMessage;
    });

    const transformedMessage = transformMessageWithDetails(
      message as PrismaMessageWithFullRelations
    );

    getIO().to(`household_${householdId}`).emit("message_update", {
      action: MessageAction.CREATED,
      message: transformedMessage,
    });

    return { data: transformedMessage };
  } catch (error) {
    logger.error(`Error creating message: ${error}`);
    throw error;
  }
}

/**
 * Update an existing message
 */
export async function updateMessage(
  householdId: string,
  threadId: string,
  messageId: string,
  data: UpdateMessageDTO,
  userId: string
): Promise<ApiResponse<MessageWithDetails>> {
  try {
    logger.info(`Updating message ${messageId}`);

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { author: true },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.authorId !== userId) {
      await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: data.content,
        updatedAt: new Date(),
      },
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
    });

    const transformedMessage = transformMessageWithDetails(
      updatedMessage as PrismaMessageWithFullRelations
    );

    getIO().to(`household_${householdId}`).emit("message_update", {
      action: MessageAction.UPDATED,
      message: transformedMessage,
    });

    return { data: transformedMessage };
  } catch (error) {
    logger.error(`Error updating message: ${error}`);
    throw error;
  }
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  householdId: string,
  threadId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    logger.info(`Deleting message ${messageId}`);

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { author: true },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.authorId !== userId) {
      await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    getIO().to(`household_${householdId}`).emit("message_update", {
      action: MessageAction.DELETED,
      messageId,
    });

    return { data: undefined };
  } catch (error) {
    logger.error(`Error deleting message: ${error}`);
    throw error;
  }
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  householdId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    logger.info(`Marking message ${messageId} as read by user ${userId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    await prisma.messageRead.upsert({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      },
      create: {
        userId,
        messageId,
        readAt: new Date(),
      },
      update: {},
    });

    return { data: undefined };
  } catch (error) {
    logger.error(`Error marking message as read: ${error}`);
    throw error;
  }
}

/**
 * Get message read status
 */
export async function getMessageReadStatus(
  householdId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<MessageReadStatus>> {
  try {
    logger.info(`Getting read status for message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const thread = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        thread: {
          select: {
            participants: {
              select: { userId: true },
            },
          },
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundError("Message not found");
    }

    const participantIds = thread.thread.participants.map((p) => p.userId);
    const readBy = thread.reads.map((r) => ({
      userId: r.userId,
      readAt: r.readAt,
    }));
    const readUserIds = readBy.map((r) => r.userId);
    const unreadBy = participantIds.filter((id) => !readUserIds.includes(id));

    return {
      data: {
        messageId,
        readBy,
        unreadBy,
      },
    };
  } catch (error) {
    logger.error(`Error getting message read status: ${error}`);
    throw error;
  }
}
