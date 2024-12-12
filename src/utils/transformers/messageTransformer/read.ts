import { MessageRead, MessageReadWithUser } from '@shared/types';
import { PrismaMessageReadWithFullRelations } from '../transformerPrismaTypes';
import { transformUser } from '../userTransformer';

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
    throw new Error('MessageRead must have a user');
  }

  if (!read.message) {
    throw new Error('MessageRead must have a message');
  }

  return {
    ...transformMessageRead(read),
    user: transformUser(read.user),
  };
}
