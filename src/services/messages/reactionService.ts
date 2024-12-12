import {
  NotFoundError,
  UnauthorizedError,
} from '../../middlewares/errorHandler';
import prisma from '../../config/database';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { HouseholdRole, MessageAction, ReactionType } from '@shared/enums';
import { CreateReactionDTO, ReactionWithUser } from '@shared/types';
import { getIO } from '../../sockets';
import { verifyMembership } from '../authService';
import { transformReactionWithUser } from '../../utils/transformers/messageTransformer';
import { PrismaReactionWithFullRelations } from '../../utils/transformers/transformerPrismaTypes';
import logger from '../../utils/logger';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// First, let's create a consistent include object for reactions
const reactionInclude = {
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
} as const;

/**
 * Add a reaction to a message
 */
export async function addReaction(
  householdId: string,
  messageId: string,
  userId: string,
  data: CreateReactionDTO
): Promise<ApiResponse<ReactionWithUser>> {
  try {
    logger.info(`Adding reaction to message ${messageId} by user ${userId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const reaction = await prisma.$transaction(async (tx) => {
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
        },
      });

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      // Check for existing reaction from this user with same type
      const existingReaction = await tx.reaction.findFirst({
        where: {
          messageId,
          userId,
          type: data.type,
        },
      });

      if (existingReaction) {
        throw new Error('User has already reacted with this reaction type');
      }

      // Create new reaction
      const newReaction = await tx.reaction.create({
        data: {
          messageId,
          userId,
          type: data.type,
          emoji: data.emoji,
        },
        include: reactionInclude,
      });

      // Update thread's updatedAt timestamp
      await tx.thread.update({
        where: { id: message.threadId },
        data: { updatedAt: new Date() },
      });

      return newReaction as PrismaReactionWithFullRelations;
    });

    const transformedReaction = transformReactionWithUser(reaction);

    // Emit socket event
    getIO().to(`household_${householdId}`).emit('reaction_update', {
      action: MessageAction.REACTION_ADDED,
      messageId,
      reaction: transformedReaction,
    });

    return wrapResponse(transformedReaction);
  } catch (error) {
    logger.error(`Error adding reaction: ${error}`);
    throw error;
  }
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(
  householdId: string,
  messageId: string,
  reactionId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    logger.info(`Removing reaction ${reactionId} from message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    await prisma.$transaction(async (tx) => {
      const reaction = await tx.reaction.findUnique({
        where: { id: reactionId },
        include: reactionInclude,
      });

      if (!reaction) {
        throw new NotFoundError('Reaction not found');
      }

      if (reaction.userId !== userId) {
        throw new UnauthorizedError('Cannot remove another user\'s reaction');
      }

      if (reaction.message.thread.householdId !== householdId) {
        throw new UnauthorizedError(
          'Reaction does not belong to this household'
        );
      }

      await tx.reaction.delete({
        where: { id: reactionId },
      });

      // Update thread's updatedAt timestamp
      await tx.thread.update({
        where: { id: reaction.message.threadId },
        data: { updatedAt: new Date() },
      });
    });

    // Emit socket event
    getIO().to(`household_${householdId}`).emit('reaction_update', {
      action: MessageAction.REACTION_REMOVED,
      messageId,
      reactionId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    logger.error(`Error removing reaction: ${error}`);
    throw error;
  }
}

/**
 * Get all reactions for a message
 */
export async function getMessageReactions(
  householdId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<ReactionWithUser[]>> {
  try {
    logger.info(`Getting reactions for message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const reactions = await prisma.reaction.findMany({
      where: {
        messageId,
        message: {
          thread: {
            householdId,
          },
        },
      },
      include: reactionInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    const transformedReactions = reactions.map((reaction) =>
      transformReactionWithUser(reaction as PrismaReactionWithFullRelations)
    );

    return wrapResponse(transformedReactions);
  } catch (error) {
    logger.error(`Error getting message reactions: ${error}`);
    throw error;
  }
}

/**
 * Get reaction analytics for a message
 */
export async function getReactionAnalytics(
  householdId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<Record<ReactionType, number>>> {
  try {
    logger.info(`Getting reaction analytics for message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const reactions = await prisma.reaction.groupBy({
      by: ['type'],
      where: {
        messageId,
        message: {
          thread: {
            householdId,
          },
        },
      },
      _count: {
        type: true,
      },
    });

    const analytics = Object.values(ReactionType).reduce(
      (acc, type) => ({
        ...acc,
        [type]: reactions.find((r) => r.type === type)?._count.type || 0,
      }),
      {} as Record<ReactionType, number>
    );

    return wrapResponse(analytics);
  } catch (error) {
    logger.error(`Error getting reaction analytics: ${error}`);
    throw error;
  }
}

/**
 * Get reactions by type for a message
 */
export async function getReactionsByType(
  householdId: string,
  messageId: string,
  type: ReactionType,
  userId: string
): Promise<ApiResponse<ReactionWithUser[]>> {
  try {
    logger.info(`Getting reactions of type ${type} for message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const reactions = await prisma.reaction.findMany({
      where: {
        messageId,
        type,
        message: {
          thread: {
            householdId,
          },
        },
      },
      include: reactionInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });

    const transformedReactions = reactions.map((reaction) =>
      transformReactionWithUser(reaction as PrismaReactionWithFullRelations)
    );

    return wrapResponse(transformedReactions);
  } catch (error) {
    logger.error(`Error getting reactions by type: ${error}`);
    throw error;
  }
}
