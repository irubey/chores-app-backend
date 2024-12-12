import {
  NotFoundError,
  UnauthorizedError,
} from '../../middlewares/errorHandler';
import prisma from '../../config/database';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { HouseholdRole, MessageAction, NotificationType } from '@shared/enums';
import { MentionWithUser, CreateMentionDTO } from '@shared/types';
import { getIO } from '../../sockets';
import { verifyMembership } from '../authService';
import { transformMentionWithUser } from '../../utils/transformers/messageTransformer';
import { PrismaMentionWithFullRelations } from '../../utils/transformers/transformerPrismaTypes';
import { createNotification } from '../notificationService';
import logger from '../../utils/logger';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Creates a new mention for a message
 */
export async function createMention(
  householdId: string,
  messageId: string,
  data: CreateMentionDTO,
  userId: string
): Promise<ApiResponse<MentionWithUser>> {
  try {
    logger.info(
      `Creating mention in message ${messageId} for user ${data.userId}`
    );

    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    // Verify the mentioned user is a member of the household
    await verifyMembership(householdId, data.userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const mention = await prisma.$transaction(async (tx) => {
      // Check if message exists and belongs to the household
      const message = await tx.message.findFirst({
        where: {
          id: messageId,
          thread: {
            householdId,
          },
        },
        include: {
          thread: true,
          author: true,
        },
      });

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      // Create the mention
      const newMention = await tx.mention.create({
        data: {
          messageId,
          userId: data.userId,
          mentionedAt: new Date(),
        },
        include: {
          message: {
            include: {
              thread: true,
            },
          },
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
        },
      });

      // Create notification for mentioned user
      await createNotification({
        userId: data.userId,
        type: NotificationType.NEW_MESSAGE,
        message: `${message.author.name} mentioned you in ${
          message.thread.title || 'a message'
        }`,
      });

      return newMention as PrismaMentionWithFullRelations;
    });

    const transformedMention = transformMentionWithUser(mention);

    // Emit socket event
    getIO().to(`household_${householdId}`).emit('mention_update', {
      action: MessageAction.MENTIONED,
      messageId,
      mention: transformedMention,
    });

    return wrapResponse(transformedMention);
  } catch (error) {
    logger.error(`Error creating mention: ${error}`);
    throw error;
  }
}

/**
 * Gets all mentions for a specific user in a household
 */
export async function getUserMentions(
  householdId: string,
  userId: string,
  includeRead: boolean = false
): Promise<ApiResponse<MentionWithUser[]>> {
  try {
    logger.info(
      `Getting mentions for user ${userId} in household ${householdId}`
    );

    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const mentions = await prisma.mention.findMany({
      where: {
        userId,
        message: {
          thread: {
            householdId,
          },
        },
      },
      include: {
        message: {
          include: {
            thread: true,
          },
        },
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
      },
      orderBy: {
        mentionedAt: 'desc',
      },
    });

    const transformedMentions = mentions.map((mention) =>
      transformMentionWithUser(mention as PrismaMentionWithFullRelations)
    );

    return wrapResponse(transformedMentions);
  } catch (error) {
    logger.error(`Error getting user mentions: ${error}`);
    throw error;
  }
}

/**
 * Gets all mentions in a specific message
 */
export async function getMessageMentions(
  householdId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<MentionWithUser[]>> {
  try {
    logger.info(`Getting mentions for message ${messageId}`);

    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const mentions = await prisma.mention.findMany({
      where: {
        messageId,
        message: {
          thread: {
            householdId,
          },
        },
      },
      include: {
        message: {
          include: {
            thread: true,
          },
        },
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
      },
      orderBy: {
        mentionedAt: 'desc',
      },
    });

    const transformedMentions = mentions.map((mention) =>
      transformMentionWithUser(mention as PrismaMentionWithFullRelations)
    );

    return wrapResponse(transformedMentions);
  } catch (error) {
    logger.error(`Error getting message mentions: ${error}`);
    throw error;
  }
}

/**
 * Deletes a mention
 */
export async function deleteMention(
  householdId: string,
  messageId: string,
  mentionId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    logger.info(`Deleting mention ${mentionId}`);

    const mention = await prisma.mention.findUnique({
      where: { id: mentionId },
      include: {
        message: {
          include: {
            author: true,
            thread: true,
          },
        },
      },
    });

    if (!mention) {
      throw new NotFoundError('Mention not found');
    }

    // Only message author or admin can delete mentions
    if (mention.message.authorId !== userId) {
      await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
    }

    await prisma.mention.delete({
      where: { id: mentionId },
    });

    // Emit socket event
    getIO().to(`household_${householdId}`).emit('mention_update', {
      action: MessageAction.MENTIONED,
      messageId,
      mentionId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    logger.error(`Error deleting mention: ${error}`);
    throw error;
  }
}

/**
 * Gets unread mentions count for a user
 */
export async function getUnreadMentionsCount(
  householdId: string,
  userId: string
): Promise<ApiResponse<number>> {
  try {
    logger.info(`Getting unread mentions count for user ${userId}`);

    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const count = await prisma.mention.count({
      where: {
        userId,
        message: {
          thread: {
            householdId,
          },
          reads: {
            none: {
              userId,
            },
          },
        },
      },
    });

    return wrapResponse(count);
  } catch (error) {
    logger.error(`Error getting unread mentions count: ${error}`);
    throw error;
  }
}
