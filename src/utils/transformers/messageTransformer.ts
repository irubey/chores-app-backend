import {
  Thread,
  Message,
  Attachment,
  Reaction,
  Mention,
  MessageRead,
  MessageWithDetails,
  ThreadWithMessages,
  ThreadWithParticipants,
  ThreadWithDetails,
  ReactionWithUser,
  MentionWithUser,
  MessageReadWithUser,
} from "@shared/types";
import { ReactionType } from "@shared/enums";
import {
  PrismaThreadBase,
  PrismaMessageBase,
  PrismaThreadWithFullRelations,
  PrismaMessageWithFullRelations,
  PrismaAttachmentWithFullRelations,
  PrismaReactionWithFullRelations,
  PrismaMentionWithFullRelations,
  PrismaMessageReadWithFullRelations,
  PrismaThreadWithMessagesAndParticipants,
  PrismaThreadWithParticipantsOnly,
} from "./transformerPrismaTypes";
import { transformUser } from "./userTransformer";
import {
  transformHousehold,
  transformHouseholdMember,
} from "./householdTransformer";

// Utility function to validate reaction types
function isValidReactionType(type: string): type is ReactionType {
  return Object.values(ReactionType).includes(type as ReactionType);
}

// Base Message Transformers
export function transformMessage(message: PrismaMessageBase): Message {
  return {
    id: message.id,
    threadId: message.threadId,
    authorId: message.authorId,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: message.deletedAt ?? undefined,
  };
}

export function transformMessageWithDetails(
  message: PrismaMessageWithFullRelations
): MessageWithDetails {
  if (!message.author) {
    throw new Error("Message must have an author");
  }

  if (!message.thread) {
    throw new Error("Message must have a thread");
  }

  const baseMessage = {
    id: message.id,
    threadId: message.threadId,
    authorId: message.authorId,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: message.deletedAt,
  };

  const reactionsWithMessage = message.reactions?.map((reaction) => ({
    ...reaction,
    message: {
      ...baseMessage,
      thread: message.thread,
    },
  }));

  const mentionsWithMessage = message.mentions?.map((mention) => ({
    ...mention,
    message: {
      ...baseMessage,
      thread: message.thread,
    },
  }));

  const readsWithMessage = message.reads?.map((read) => ({
    ...read,
    message: {
      ...baseMessage,
      thread: message.thread,
    },
  }));

  return {
    ...transformMessage(message),
    thread: transformThread(message.thread),
    author: transformUser(message.author),
    attachments: message.attachments?.map(transformAttachment) || [],
    reactions: reactionsWithMessage?.map(transformReactionWithUser) || [],
    mentions: mentionsWithMessage?.map(transformMentionWithUser) || [],
    reads: readsWithMessage?.map(transformMessageReadWithUser) || [],
  };
}

// Thread Transformers
export function transformThread(thread: PrismaThreadBase): Thread {
  return {
    id: thread.id,
    householdId: thread.householdId,
    authorId: thread.authorId,
    title: thread.title ?? undefined,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    deletedAt: thread.deletedAt ?? undefined,
  };
}

export function transformThreadWithDetails(
  thread: PrismaThreadWithFullRelations
): ThreadWithDetails {
  if (!thread.author) {
    throw new Error("Thread must have an author");
  }

  if (!thread.household) {
    throw new Error("Thread must have a household");
  }

  const transformedHousehold = transformHousehold(thread.household);

  return {
    ...transformThread(thread),
    author: transformUser(thread.author),
    household: transformedHousehold,
    messages:
      thread.messages?.map((message) =>
        transformMessageWithDetails({
          ...message,
          thread: {
            id: thread.id,
            householdId: thread.householdId,
            authorId: thread.authorId,
            title: thread.title,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            deletedAt: thread.deletedAt,
          },
          attachments: message.attachments?.map((attachment) => ({
            ...attachment,
            message: {
              id: message.id,
              threadId: message.threadId,
            },
          })),
        } as PrismaMessageWithFullRelations)
      ) || [],
    participants: thread.participants?.map(transformHouseholdMember) || [],
  };
}

export function transformThreadWithMessages(
  thread: PrismaThreadWithMessagesAndParticipants
): ThreadWithMessages {
  return {
    ...transformThread(thread),
    messages: thread.messages?.map(transformMessage) || [],
  };
}

export function transformThreadWithParticipants(
  thread: PrismaThreadWithParticipantsOnly
): ThreadWithParticipants {
  return {
    ...transformThread(thread),
    participants: thread.participants?.map(transformHouseholdMember) || [],
  };
}

// Attachment Transformer
export function transformAttachment(
  attachment: PrismaAttachmentWithFullRelations
): Attachment {
  return {
    id: attachment.id,
    messageId: attachment.messageId,
    url: attachment.url,
    fileType: attachment.fileType,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
    deletedAt: attachment.deletedAt ?? undefined,
  };
}

// Reaction Transformer
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
    throw new Error("Reaction must have a user");
  }

  if (!reaction.message) {
    throw new Error("Reaction must have a message");
  }

  return {
    ...transformReaction(reaction),
    user: transformUser(reaction.user),
  };
}

// Mention Transformer
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

// Message Read Transformer
export function transformMessageRead(
  read: PrismaMessageReadWithFullRelations
): MessageRead {
  return {
    id: read.id,
    messageId: read.messageId,
    userId: read.userId,
    readAt: read.readAt,
  };
}

export function transformMessageReadWithUser(
  read: PrismaMessageReadWithFullRelations
): MessageReadWithUser {
  if (!read.user) {
    throw new Error("MessageRead must have a user");
  }

  if (!read.message) {
    throw new Error("MessageRead must have a message");
  }

  return {
    ...transformMessageRead(read),
    user: transformUser(read.user),
  };
}

// Analytics Transformers
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
