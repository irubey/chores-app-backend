import prisma from '../config/database';
import {
  CreateThreadDTO,
  Thread,
  ThreadWithMessages,
  ThreadWithParticipants,
  UpdateThreadDTO,
  InviteUsersDTO,
  ThreadWithDetails,
} from '@shared/types';
import { PaginationOptions } from '@shared/interfaces';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { HouseholdRole, ThreadAction } from '@shared/enums';
import { verifyMembership } from './authService';
import {
  transformThread,
  transformThreadWithDetails,
  transformThreadWithMessages,
  transformThreadWithParticipants,
} from '../utils/transformers/messageTransformer';
import {
  PrismaThreadWithFullRelations,
  PrismaThreadWithMessagesAndParticipants,
  PrismaThreadWithParticipantsOnly,
  userMinimalSelect,
} from '../utils/transformers/transformerPrismaTypes';
import logger from '../utils/logger';
import {
  wrapResponse,
  handleServiceError,
  emitThreadEvent,
} from '../utils/servicesUtils';

/**
 * Retrieves all threads for a specific household.
 */
export async function getThreads(
  householdId: string,
  userId: string,
  options?: PaginationOptions
): Promise<ApiResponse<ThreadWithDetails[]>> {
  logger.debug('Fetching threads for household', {
    householdId,
    userId,
    options,
  });

  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const threads = await prisma.thread.findMany({
      where: { householdId },
      take: options?.limit || 20,
      skip: options?.cursor ? 1 : 0,
      cursor: options?.cursor ? { id: options.cursor } : undefined,
      orderBy: {
        [options?.sortBy || 'updatedAt']: options?.direction || 'desc',
      },
      include: {
        author: {
          select: userMinimalSelect,
        },
        household: true,
        messages: {
          take: 20, // Fixed limit for initial messages
          orderBy: { createdAt: 'desc' },
          include: {
            thread: {
              select: {
                id: true,
                householdId: true,
                authorId: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
              },
            },
            author: {
              select: userMinimalSelect,
            },
            attachments: {
              include: {
                message: {
                  select: {
                    id: true,
                    threadId: true,
                  },
                },
              },
            },
            reactions: {
              include: {
                user: {
                  select: userMinimalSelect,
                },
                message: {
                  include: {
                    thread: {
                      select: {
                        id: true,
                        householdId: true,
                        authorId: true,
                        title: true,
                        createdAt: true,
                        updatedAt: true,
                        deletedAt: true,
                      },
                    },
                  },
                },
              },
            },
            mentions: {
              include: {
                user: {
                  select: userMinimalSelect,
                },
                message: {
                  include: {
                    thread: {
                      select: {
                        id: true,
                        householdId: true,
                        authorId: true,
                        title: true,
                        createdAt: true,
                        updatedAt: true,
                        deletedAt: true,
                      },
                    },
                  },
                },
              },
            },
            reads: {
              include: {
                user: {
                  select: userMinimalSelect,
                },
                message: {
                  include: {
                    thread: {
                      select: {
                        id: true,
                        householdId: true,
                        authorId: true,
                        title: true,
                        createdAt: true,
                        updatedAt: true,
                        deletedAt: true,
                      },
                    },
                  },
                },
              },
            },
            poll: {
              include: {
                message: {
                  include: {
                    thread: true,
                  },
                },
                event: true,
                options: {
                  include: {
                    votes: {
                      include: {
                        user: {
                          select: userMinimalSelect,
                        },
                      },
                    },
                    selectedForPolls: true,
                  },
                },
                selectedOption: {
                  include: {
                    votes: {
                      include: {
                        user: {
                          select: userMinimalSelect,
                        },
                      },
                    },
                    selectedForPolls: true,
                  },
                },
              },
            },
          },
        },
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    const lastThread = threads[threads.length - 1];
    const hasMore = threads.length === (options?.limit || 20);

    logger.info('Successfully retrieved threads', {
      householdId,
      threadCount: threads.length,
      hasMore,
      lastThreadId: lastThread?.id,
    });

    return wrapResponse(threads.map(transformThreadWithDetails));
  } catch (error) {
    return handleServiceError(error, 'fetch threads', { householdId }) as never;
  }
}

/**
 * Creates a new thread.
 */
export async function createThread(
  data: CreateThreadDTO,
  userId: string
): Promise<ApiResponse<ThreadWithDetails>> {
  logger.debug('Creating new thread', {
    householdId: data.householdId,
    userId,
  });

  try {
    const thread = await prisma.$transaction(async (tx) => {
      const newThread = await tx.thread.create({
        data: {
          householdId: data.householdId,
          title: data.title,
          authorId: userId,
          participants: {
            connect: data.participants.map((userId) => ({
              userId_householdId: {
                userId,
                householdId: data.householdId,
              },
            })),
          },
        },
        include: {
          author: {
            select: userMinimalSelect,
          },
          household: true,
          messages: {
            include: {
              author: {
                select: userMinimalSelect,
              },
              thread: true,
              attachments: true,
              reactions: true,
              mentions: true,
            },
          },
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (data.initialMessage) {
        await tx.message.create({
          data: {
            threadId: newThread.id,
            content: data.initialMessage.content,
            authorId: userId,
            ...(data.initialMessage.attachments && {
              attachments: {
                create: data.initialMessage.attachments.map((attachment) => ({
                  url: attachment.url,
                  fileType: attachment.fileType,
                })),
              },
            }),
            ...(data.initialMessage.mentions && {
              mentions: {
                create: data.initialMessage.mentions.map((userId) => ({
                  userId,
                  mentionedAt: new Date(),
                })),
              },
            }),
          },
        });
      }

      return newThread;
    });

    logger.info('Successfully created thread', {
      threadId: thread.id,
      householdId: data.householdId,
    });

    const transformedThread = transformThreadWithDetails(thread);

    emitThreadEvent('thread_update', thread.id, data.householdId, {
      action: ThreadAction.CREATED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    return handleServiceError(error, 'create thread') as never;
  }
}

/**
 * Retrieves details of a specific thread.
 */
export async function getThreadById(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<ThreadWithDetails>> {
  logger.debug('Fetching thread by ID', { householdId, threadId, userId });

  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: userMinimalSelect,
        },
        household: true,
        messages: {
          include: {
            author: {
              select: userMinimalSelect,
            },
            thread: true,
            attachments: true,
            reactions: true,
            mentions: true,
          },
        },
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!thread) {
      logger.warn('Thread not found', { threadId });
      throw new NotFoundError('Thread not found');
    }

    logger.info('Successfully retrieved thread', { threadId });

    return wrapResponse(transformThreadWithDetails(thread));
  } catch (error) {
    return handleServiceError(error, 'fetch thread by ID', {
      threadId,
    }) as never;
  }
}

/**
 * Updates an existing thread.
 */
export async function updateThread(
  householdId: string,
  threadId: string,
  data: UpdateThreadDTO,
  userId: string
): Promise<ApiResponse<ThreadWithDetails>> {
  logger.debug('Updating thread', { householdId, threadId, userId });

  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const updatedThread = await prisma.$transaction(async (tx) => {
      if (data.participants?.add?.length) {
        const householdMembers = await tx.householdMember.findMany({
          where: {
            householdId,
            userId: { in: data.participants.add },
          },
        });

        if (householdMembers.length !== data.participants.add.length) {
          throw new UnauthorizedError(
            'Some users are not members of this household'
          );
        }
      }

      return tx.thread.update({
        where: { id: threadId },
        data: {
          title: data.title,
          ...(data.participants && {
            participants: {
              ...(data.participants.add && {
                connect: data.participants.add.map((userId) => ({
                  userId_householdId: { userId, householdId },
                })),
              }),
              ...(data.participants.remove && {
                disconnect: data.participants.remove.map((userId) => ({
                  userId_householdId: { userId, householdId },
                })),
              }),
            },
          }),
        },
        include: {
          author: {
            select: userMinimalSelect,
          },
          household: true,
          messages: {
            include: {
              author: {
                select: userMinimalSelect,
              },
              thread: true,
              attachments: true,
              reactions: true,
              mentions: true,
            },
          },
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    logger.info('Successfully updated thread', { threadId });

    const transformedThread = transformThreadWithDetails(updatedThread);

    emitThreadEvent('thread_update', threadId, householdId, {
      action: ThreadAction.UPDATED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    return handleServiceError(error, 'update thread', { threadId }) as never;
  }
}

/**
 * Deletes a thread.
 */
export async function deleteThread(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<void>> {
  logger.debug('Deleting thread', { householdId, threadId, userId });

  try {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

    await prisma.thread.delete({ where: { id: threadId } });

    logger.info('Successfully deleted thread', { threadId });

    emitThreadEvent('thread_update', threadId, householdId, {
      action: ThreadAction.DELETED,
      threadId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, 'delete thread', { threadId }) as never;
  }
}

/**
 * Invites users to a thread.
 */
export async function inviteUsersToThread(
  householdId: string,
  threadId: string,
  data: InviteUsersDTO,
  userId: string
): Promise<ApiResponse<ThreadWithDetails>> {
  logger.debug('Inviting users to thread', {
    householdId,
    threadId,
    userIds: data.userIds,
    requestingUserId: userId,
  });

  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const updatedThread = await prisma.$transaction(async (tx) => {
      const householdMembers = await tx.householdMember.findMany({
        where: {
          householdId,
          userId: { in: data.userIds },
        },
      });

      if (householdMembers.length !== data.userIds.length) {
        throw new UnauthorizedError(
          'Some users are not members of this household'
        );
      }

      return tx.thread.update({
        where: { id: threadId },
        data: {
          participants: {
            connect: data.userIds.map((userId) => ({
              userId_householdId: {
                userId,
                householdId,
              },
            })),
          },
        },
        include: {
          author: {
            select: userMinimalSelect,
          },
          household: true,
          messages: {
            include: {
              author: {
                select: userMinimalSelect,
              },
              thread: true,
              attachments: true,
              reactions: true,
              mentions: true,
            },
          },
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    logger.info('Successfully invited users to thread', {
      threadId,
      invitedUserCount: data.userIds.length,
    });

    const transformedThread = transformThreadWithDetails(updatedThread);

    emitThreadEvent('thread_update', threadId, householdId, {
      action: ThreadAction.USERS_INVITED,
      thread: transformedThread,
    });

    return wrapResponse(transformedThread);
  } catch (error) {
    return handleServiceError(error, 'invite users to thread', {
      threadId,
    }) as never;
  }
}
