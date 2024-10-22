import {
  Message,
  Thread,
  Attachment,
  Reaction,
  Mention,
  MessageRead,
  MessageWithDetails,
  ThreadWithMessages,
  ThreadWithParticipants,
  User,
} from "@shared/types";
import { ReactionType } from "@shared/enums";
import {
  PrismaMessage,
  PrismaThread,
  PrismaAttachment,
  PrismaReaction,
  PrismaMention,
  PrismaMessageRead,
  PrismaUser,
} from "./transformerTypes";
import { transformHouseholdMember } from "./householdTransformer";

function isValidReactionType(type: string): type is ReactionType {
  return Object.values(ReactionType).includes(type as ReactionType);
}

function transformUser(user: PrismaUser): User {
  return {
    ...user,
    deletedAt: user.deletedAt ?? undefined,
    profileImageURL: user.profileImageURL ?? "",
  };
}

export function transformMessage(message: PrismaMessage): Message {
  return {
    id: message.id,
    threadId: message.threadId,
    authorId: message.authorId,
    content: message.content,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: message.deletedAt ?? undefined,
    reactions: message.reactions?.map(transformReaction) ?? [],
    mentions: message.mentions?.map(transformMention) ?? [],
    reads: message.reads?.map(transformMessageRead) ?? [],
  };
}

export function transformMessageWithDetails(
  message: PrismaMessage & { author: PrismaUser }
): MessageWithDetails {
  return {
    ...transformMessage(message),
    author: transformUser(message.author),
    attachments: message.attachments?.map(transformAttachment) ?? [],
  };
}

export function transformThread(thread: PrismaThread): Thread {
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

export function transformThreadWithMessages(
  thread: PrismaThread & {
    messages: (PrismaMessage & { author: PrismaUser })[];
  }
): ThreadWithMessages {
  return {
    ...transformThread(thread),
    messages: thread.messages.map(transformMessageWithDetails),
  };
}

export function transformThreadWithParticipants(
  thread: PrismaThread & {
    participants: any[]; // Using any[] since we're using the existing householdTransformer
  }
): ThreadWithParticipants {
  return {
    ...transformThread(thread),
    participants: thread.participants.map(transformHouseholdMember),
  };
}

export function transformAttachment(attachment: PrismaAttachment): Attachment {
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

export function transformReaction(reaction: PrismaReaction): Reaction {
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

export function transformMention(mention: PrismaMention): Mention {
  return {
    id: mention.id,
    messageId: mention.messageId,
    userId: mention.userId,
    mentionedAt: mention.mentionedAt,
  };
}

export function transformMessageRead(read: PrismaMessageRead): MessageRead {
  return {
    id: read.id,
    messageId: read.messageId,
    userId: read.userId,
    readAt: read.readAt,
  };
}
