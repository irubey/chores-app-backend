import { Mention, MentionWithUser } from "@shared/types";
import { PrismaMentionWithFullRelations } from "../transformerPrismaTypes";
import { transformUser } from "../userTransformer";

export function transformMention(
  mention: PrismaMentionWithFullRelations
): Mention {
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
  if (!mention.user) {
    throw new Error("Mention must have a user");
  }

  if (!mention.message) {
    throw new Error("Mention must have a message");
  }

  return {
    ...transformMention(mention),
    user: transformUser(mention.user),
  };
}
