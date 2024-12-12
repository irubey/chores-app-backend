import { Reaction, ReactionWithUser } from '@shared/types';
import { ReactionType } from '@shared/enums';
import { PrismaReactionWithFullRelations } from '../transformerPrismaTypes';
import { transformUser } from '../userTransformer';

function isValidReactionType(type: string): type is ReactionType {
  return Object.values(ReactionType).includes(type as ReactionType);
}

export function transformReaction(
  reaction: PrismaReactionWithFullRelations
): Reaction {
  return {
    id: reaction.id,
    messageId: reaction.messageId,
    userId: reaction.userId,
    emoji: reaction.emoji,
    type: isValidReactionType(reaction.type)
      ? reaction.type
      : ReactionType.LIKE,
    createdAt: reaction.createdAt,
  };
}

export function transformReactionWithUser(
  reaction: PrismaReactionWithFullRelations
): ReactionWithUser {
  if (!reaction.user) {
    throw new Error('Reaction must have a user');
  }

  if (!reaction.message) {
    throw new Error('Reaction must have a message');
  }

  return {
    ...transformReaction(reaction),
    user: transformUser(reaction.user),
  };
}

export function transformReactionAnalytics(
  analytics: { type: string; _count: { type: number } }[]
): Record<ReactionType, number> {
  return Object.values(ReactionType).reduce(
    (acc, type) => ({
      ...acc,
      [type]: analytics.find((a) => a.type === type)?._count.type || 0,
    }),
    {} as Record<ReactionType, number>
  );
}
