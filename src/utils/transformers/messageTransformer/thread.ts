import {
  Thread,
  ThreadWithDetails,
  ThreadWithMessages,
  ThreadWithParticipants,
} from '@shared/types';
import {
  PrismaThreadBase,
  PrismaThreadWithFullRelations,
  PrismaThreadWithMessagesAndParticipants,
  PrismaThreadWithParticipantsOnly,
} from '../transformerPrismaTypes';
import { transformUser } from '../userTransformer';
import {
  transformHousehold,
  transformHouseholdMember,
} from '../householdTransformer';
import { transformMessage, transformMessageWithDetails } from './message';

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
    throw new Error('Thread must have an author');
  }

  if (!thread.household) {
    throw new Error('Thread must have a household');
  }

  const threadForMessage = {
    id: thread.id,
    householdId: thread.householdId,
    authorId: thread.authorId,
    title: thread.title,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    deletedAt: thread.deletedAt,
  };

  return {
    ...transformThread(thread),
    author: transformUser(thread.author),
    household: transformHousehold(thread.household),
    messages:
      thread.messages?.map((message) =>
        transformMessageWithDetails({
          ...message,
          thread: threadForMessage,
        })
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
