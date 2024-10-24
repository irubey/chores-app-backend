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
import { transformHouseholdMember } from "./householdTransformer";

function isValidReactionType(type: string): type is ReactionType {
  return Object.values(ReactionType).includes(type as ReactionType);
}

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

  const transformedMessage: MessageWithDetails = {
    ...transformMessage(message),
    author: transformUser(message.author),
    attachments: message.attachments?.map(transformAttachment),
    reactions: message.reactions?.map(transformReactionWithUser),
    mentions: message.mentions?.map(transformMentionWithUser),
    reads: message.reads?.map(transformMessageReadWithUser),
  };

  return transformedMessage;
}

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

export function transformThreadWithMessages(
  thread: PrismaThreadWithMessagesAndParticipants
): ThreadWithMessages {
  if (!thread.messages) {
    return {
      ...transformThread(thread),
      messages: [],
    };
  }

  return {
    ...transformThread(thread),
    messages: thread.messages.map((message) =>
      transformMessageWithDetails({
        ...message,
        thread: thread,
      })
    ),
  };
}

export function transformThreadWithParticipants(
  thread: PrismaThreadWithParticipantsOnly
): ThreadWithParticipants {
  if (!thread.participants) {
    return {
      ...transformThread(thread),
      participants: [],
    };
  }

  return {
    ...transformThread(thread),
    participants: thread.participants.map(transformHouseholdMember),
  };
}

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

export function transformReactionWithUser(
  reaction: PrismaReactionWithFullRelations
): ReactionWithUser {
  if (!reaction.user) {
    throw new Error("Reaction must have a user");
  }

  return {
    id: reaction.id,
    messageId: reaction.messageId,
    userId: reaction.userId,
    emoji: reaction.emoji,
    type: isValidReactionType(reaction.type)
      ? reaction.type
      : ReactionType.LIKE,
    createdAt: reaction.createdAt,
    user: transformUser(reaction.user),
  };
}

export function transformMentionWithUser(
  mention: PrismaMentionWithFullRelations
): MentionWithUser {
  if (!mention.user) {
    throw new Error("Mention must have a user");
  }

  return {
    id: mention.id,
    messageId: mention.messageId,
    userId: mention.userId,
    mentionedAt: mention.mentionedAt,
    user: transformUser(mention.user),
  };
}

export function transformMessageReadWithUser(
  read: PrismaMessageReadWithFullRelations
): MessageReadWithUser {
  if (!read.user) {
    throw new Error("MessageRead must have a user");
  }

  return {
    id: read.id,
    messageId: read.messageId,
    userId: read.userId,
    readAt: read.readAt,
    user: transformUser(read.user),
  };
}
