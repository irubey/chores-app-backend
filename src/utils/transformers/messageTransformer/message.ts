import { Message, MessageWithDetails } from '@shared/types';
import {
  PrismaMessageBase,
  PrismaMessageWithFullRelations,
  PrismaPollWithFullRelations,
} from '../transformerPrismaTypes';
import { transformThread } from './thread';
import { transformUser } from '../userTransformer';
import { transformAttachment } from './attachment';
import { transformReactionWithUser } from './reaction';
import { transformMentionWithUser } from './mention';
import { transformMessageReadWithUser } from './read';
import { transformPollWithDetails } from './poll';

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
    throw new Error('Message must have an author');
  }

  if (!message.thread) {
    throw new Error('Message must have a thread');
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

  return {
    ...transformMessage(message),
    thread: transformThread(message.thread),
    author: transformUser(message.author),
    attachments: message.attachments?.map(transformAttachment),
    reactions: message.reactions?.map(transformReactionWithUser),
    mentions: message.mentions?.map(transformMentionWithUser),
    reads: message.reads?.map(transformMessageReadWithUser),
    poll: message.poll
      ? transformPollWithDetails(message.poll as PrismaPollWithFullRelations)
      : undefined,
  };
}
