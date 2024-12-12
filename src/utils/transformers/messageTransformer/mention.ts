import { Mention, MentionWithUser } from '@shared/types';
import { PrismaMentionWithFullRelations } from '../transformerPrismaTypes';
import { transformUser } from '../userTransformer';

function validateMentionData(mention: PrismaMentionWithFullRelations): void {
  if (!mention.id) {
    throw new Error('Mention must have an id');
  }
  if (!mention.messageId) {
    throw new Error('Mention must have a messageId');
  }
  if (!mention.userId) {
    throw new Error('Mention must have a userId');
  }
  if (!mention.mentionedAt) {
    throw new Error('Mention must have a mentionedAt date');
  }
}

export function transformMention(
  mention: PrismaMentionWithFullRelations
): Mention {
  validateMentionData(mention);

  return {
    id: mention.id,
    messageId: mention.messageId,
    userId: mention.userId,
    mentionedAt: mention.mentionedAt,
  };
}

export function transformMentionWithUser(
  mention: PrismaMentionWithFullRelations
): MentionWithUser {
  validateMentionData(mention);

  if (!mention.user) {
    throw new Error('Mention must have a user');
  }

  if (!mention.message) {
    throw new Error('Mention must have a message');
  }

  return {
    ...transformMention(mention),
    user: transformUser(mention.user),
  };
}
