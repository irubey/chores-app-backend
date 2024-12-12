import {
  NotFoundError,
  UnauthorizedError,
} from '../../middlewares/errorHandler';
import prisma from '../../config/database';
import logger from '../../utils/logger';
import { getIO } from '../../sockets';
import { verifyMembership } from '../authService';
import {
  transformMessage,
  transformMessageWithDetails,
} from '../../utils/transformers/messageTransformer';
import {
  CreateMessageDTO,
  UpdateMessageDTO,
  Message,
  MessageWithDetails,
  MessageReadStatus,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { PaginationOptions } from '@shared/interfaces/pagination';
import { HouseholdRole, MessageAction } from '@shared/enums';
import { PrismaMessageWithFullRelations } from '../../utils/transformers/transformerPrismaTypes';
import { wrapResponse, handleServiceError } from '../../utils/servicesUtils';

/**
 * Get messages for a thread with pagination
 */
export async function getMessages(
  householdId: string,
  threadId: string,
  userId: string,
  options: PaginationOptions = {}
): Promise<ApiResponse<MessageWithDetails[]>> {
  logger.info(`Fetching messages for thread ${threadId}`);

  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const messages = await prisma.message.findMany({
      where: { threadId },
      take: options?.limit || 20,
      skip: options?.cursor ? 1 : 0,
      cursor: options?.cursor ? { id: options.cursor } : undefined,
      orderBy: {
        [options?.sortBy || 'createdAt']: options?.direction || 'desc',
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

    const lastMessage = messages[messages.length - 1];
    const hasMore = messages.length === (options?.limit || 20);

    logger.info('Successfully retrieved messages', {
      threadId,
      messageCount: messages.length,
      hasMore,
      lastMessageId: lastMessage?.id,
    });

    return wrapResponse(
      messages.map((msg) =>
        transformMessageWithDetails(msg as PrismaMessageWithFullRelations)
      ),
      {
        hasMore,
        nextCursor: hasMore ? lastMessage?.id : undefined,
        total: messages.length,
      }
    );
  } catch (error) {
    return handleServiceError(error, 'fetch messages', { threadId }) as never;
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

      await tx.thread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      return newMessage;
    });

    const transformedMessage = transformMessageWithDetails(
      message as PrismaMessageWithFullRelations
    );

    getIO().to(`household_${householdId}`).emit('message_update', {
      action: MessageAction.CREATED,
      message: transformedMessage,
    });

    return wrapResponse(transformedMessage);
  } catch (error) {
    return handleServiceError(error, 'create message', { threadId }) as never;
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
      throw new NotFoundError('Message not found');
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

    getIO().to(`household_${householdId}`).emit('message_update', {
      action: MessageAction.UPDATED,
      message: transformedMessage,
    });

    return wrapResponse(transformedMessage);
  } catch (error) {
    return handleServiceError(error, 'update message', { messageId }) as never;
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
      throw new NotFoundError('Message not found');
    }

    if (message.authorId !== userId) {
      await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    getIO().to(`household_${householdId}`).emit('message_update', {
      action: MessageAction.DELETED,
      messageId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, 'delete message', { messageId }) as never;
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

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, 'mark message as read', {
      messageId,
    }) as never;
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
      throw new NotFoundError('Message not found');
    }

    const participantIds = thread.thread.participants.map((p) => p.userId);
    const readBy = thread.reads.map((r) => ({
      userId: r.userId,
      readAt: r.readAt,
    }));
    const readUserIds = readBy.map((r) => r.userId);
    const unreadBy = participantIds.filter((id) => !readUserIds.includes(id));

    return wrapResponse({
      messageId,
      readBy,
      unreadBy,
    });
  } catch (error) {
    return handleServiceError(error, 'get message read status', {
      messageId,
    }) as never;
  }
}
