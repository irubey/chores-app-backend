import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../middlewares/errorHandler';
import prisma from '../../config/database';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import {
  HouseholdRole,
  MessageAction,
  PollStatus,
  PollType,
} from '@shared/enums';
import { getIO } from '../../sockets';
import { verifyMembership } from '../authService';
import {
  PollWithDetails,
  CreatePollDTO,
  UpdatePollDTO,
  PollVoteWithUser,
  CreatePollVoteDTO,
} from '@shared/types';
import {
  transformPollWithDetails,
  transformPollVoteWithUser,
  transformPollAnalytics,
} from '../../utils/transformers/messageTransformer';
import {
  PrismaPollWithFullRelations,
  PrismaPollVoteWithFullRelations,
} from '../../utils/transformers/transformerPrismaTypes';
import logger from '../../utils/logger';

function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

function isValidPollStatus(status: string): status is PollStatus {
  return Object.values(PollStatus).includes(status as PollStatus);
}

export async function getPollsInThread(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<PollWithDetails[]>> {
  try {
    logger.info(`Getting polls for thread ${threadId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const polls = await prisma.poll.findMany({
      where: {
        message: {
          threadId,
          thread: { householdId },
        },
      },
      include: {
        options: {
          include: {
            votes: {
              include: {
                user: true,
              },
            },
            selectedForPolls: true,
          },
        },
        selectedOption: {
          include: {
            votes: {
              include: {
                user: true,
              },
            },
            selectedForPolls: true,
          },
        },
        event: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedPolls = polls.map((poll) =>
      transformPollWithDetails(poll as PrismaPollWithFullRelations)
    );

    return wrapResponse(transformedPolls);
  } catch (error) {
    logger.error(`Error getting polls in thread: ${error}`);
    throw error;
  }
}

export async function getPoll(
  householdId: string,
  messageId: string,
  pollId: string,
  userId: string
): Promise<ApiResponse<PollWithDetails>> {
  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        messageId,
        message: {
          thread: { householdId },
        },
      },
      include: {
        options: {
          include: {
            votes: {
              include: {
                user: true,
              },
            },
            selectedForPolls: true,
          },
        },
        selectedOption: {
          include: {
            votes: {
              include: {
                user: true,
              },
            },
            selectedForPolls: true,
          },
        },
        event: true,
      },
    });

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    return wrapResponse(
      transformPollWithDetails(poll as PrismaPollWithFullRelations)
    );
  } catch (error) {
    logger.error(`Error getting poll: ${error}`);
    throw error;
  }
}

export async function createPoll(
  householdId: string,
  messageId: string,
  data: CreatePollDTO,
  userId: string
): Promise<ApiResponse<PollWithDetails>> {
  try {
    logger.info(`Creating poll for message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const poll = await prisma.$transaction(async (tx) => {
      const message = await tx.message.findFirst({
        where: {
          id: messageId,
          thread: { householdId },
        },
        include: { thread: true },
      });

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      if (message.authorId !== userId) {
        throw new UnauthorizedError('Only message author can create polls');
      }

      const newPoll = await tx.poll.create({
        data: {
          messageId,
          question: data.question,
          pollType: data.pollType,
          maxChoices: data.maxChoices,
          maxRank: data.maxRank,
          endDate: data.endDate,
          eventId: data.eventId,
          status: 'OPEN',
          options: {
            create: data.options.map((opt, index) => ({
              text: opt.text,
              order: index,
              startTime: opt.startTime,
              endTime: opt.endTime,
            })),
          },
        },
        include: {
          options: {
            include: {
              votes: {
                include: {
                  user: true,
                },
              },
              selectedForPolls: true,
            },
          },
          selectedOption: {
            include: {
              votes: {
                include: {
                  user: true,
                },
              },
              selectedForPolls: true,
            },
          },
          event: true,
        },
      });

      return newPoll as PrismaPollWithFullRelations;
    });

    const transformedPoll = transformPollWithDetails(poll);

    getIO().to(`household_${householdId}`).emit('poll_update', {
      action: MessageAction.POLL_CREATED,
      messageId,
      poll: transformedPoll,
    });

    return wrapResponse(transformedPoll);
  } catch (error) {
    logger.error(`Error creating poll: ${error}`);
    throw error;
  }
}

export async function updatePoll(
  householdId: string,
  messageId: string,
  pollId: string,
  data: UpdatePollDTO,
  userId: string
): Promise<ApiResponse<PollWithDetails>> {
  try {
    logger.info(`Updating poll ${pollId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const poll = await prisma.$transaction(async (tx) => {
      const existingPoll = await tx.poll.findFirst({
        where: {
          id: pollId,
          messageId,
          message: {
            thread: { householdId },
          },
        },
        include: { message: true },
      });

      if (!existingPoll) {
        throw new NotFoundError('Poll not found');
      }

      if (existingPoll.message.authorId !== userId) {
        throw new UnauthorizedError('Only poll creator can update poll');
      }

      const updatedPoll = await tx.poll.update({
        where: { id: pollId },
        data: {
          question: data.question,
          status: data.status
            ? isValidPollStatus(data.status)
              ? data.status
              : 'OPEN'
            : undefined,
          endDate: data.endDate,
          selectedOptionId: data.selectedOptionId,
        },
        include: {
          options: {
            include: {
              votes: {
                include: {
                  user: true,
                },
              },
              selectedForPolls: true,
            },
          },
          selectedOption: {
            include: {
              votes: {
                include: {
                  user: true,
                },
              },
              selectedForPolls: true,
            },
          },
          event: true,
        },
      });

      return updatedPoll as PrismaPollWithFullRelations;
    });

    const transformedPoll = transformPollWithDetails(poll);

    getIO().to(`household_${householdId}`).emit('poll_update', {
      action: MessageAction.POLL_UPDATED,
      messageId,
      poll: transformedPoll,
    });

    return wrapResponse(transformedPoll);
  } catch (error) {
    logger.error(`Error updating poll: ${error}`);
    throw error;
  }
}

export async function deletePoll(
  householdId: string,
  messageId: string,
  pollId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    logger.info(`Deleting poll ${pollId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const poll = await prisma.$transaction(async (tx) => {
      const existingPoll = await tx.poll.findFirst({
        where: {
          id: pollId,
          messageId,
          message: {
            thread: { householdId },
          },
        },
        include: { message: true },
      });

      if (!existingPoll) {
        throw new NotFoundError('Poll not found');
      }

      if (existingPoll.message.authorId !== userId) {
        throw new UnauthorizedError('Only poll creator can delete poll');
      }

      await tx.pollVote.deleteMany({
        where: { pollId },
      });

      await tx.pollOption.deleteMany({
        where: { pollId },
      });

      return tx.poll.delete({
        where: { id: pollId },
      });
    });

    getIO().to(`household_${householdId}`).emit('poll_update', {
      action: MessageAction.POLL_DELETED,
      messageId,
      pollId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    logger.error(`Error deleting poll: ${error}`);
    throw error;
  }
}

export async function votePoll(
  householdId: string,
  messageId: string,
  pollId: string,
  data: CreatePollVoteDTO,
  userId: string
): Promise<ApiResponse<PollVoteWithUser>> {
  try {
    logger.info(`Voting on poll ${pollId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const vote = await prisma.$transaction(async (tx) => {
      const poll = await tx.poll.findFirst({
        where: {
          id: pollId,
          messageId,
          message: {
            thread: { householdId },
          },
        },
      });

      if (!poll) {
        throw new NotFoundError('Poll not found');
      }

      if (poll.status !== 'OPEN') {
        throw new ValidationError('Poll is not active');
      }

      // Delete existing votes if not multiple choice
      if (poll.pollType !== PollType.MULTIPLE_CHOICE) {
        await tx.pollVote.deleteMany({
          where: {
            pollId,
            userId,
          },
        });
      }

      const newVote = await tx.pollVote.create({
        data: {
          pollId,
          optionId: data.optionId,
          userId,
          rank: data.rank,
          availability: data.availability,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              profileImageURL: true,
              createdAt: true,
              updatedAt: true,
              deletedAt: true,
            },
          },
          option: {
            include: {
              poll: true,
              votes: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true,
                      profileImageURL: true,
                      createdAt: true,
                      updatedAt: true,
                      deletedAt: true,
                    },
                  },
                },
              },
              selectedForPolls: true,
            },
          },
        },
      });

      return newVote as PrismaPollVoteWithFullRelations;
    });

    const transformedVote = transformPollVoteWithUser(vote);

    getIO().to(`household_${householdId}`).emit('poll_vote_update', {
      action: MessageAction.POLL_VOTED,
      messageId,
      pollId,
      vote: transformedVote,
    });

    return wrapResponse(transformedVote);
  } catch (error) {
    logger.error(`Error voting on poll: ${error}`);
    throw error;
  }
}

export async function removePollVote(
  householdId: string,
  messageId: string,
  pollId: string,
  voteId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const vote = await prisma.pollVote.findFirst({
      where: {
        id: voteId,
        pollId,
        userId,
        option: {
          poll: {
            messageId,
            message: {
              thread: { householdId },
            },
          },
        },
      },
    });

    if (!vote) {
      throw new NotFoundError('Vote not found');
    }

    await prisma.pollVote.delete({
      where: { id: voteId },
    });

    getIO().to(`household_${householdId}`).emit('poll_vote_update', {
      action: MessageAction.POLL_VOTE_REMOVED,
      messageId,
      pollId,
      voteId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    logger.error(`Error deleting vote: ${error}`);
    throw error;
  }
}

export async function getPollAnalytics(
  householdId: string,
  messageId: string,
  pollId: string,
  userId: string
): Promise<ApiResponse<any>> {
  try {
    logger.info(`Getting analytics for poll ${pollId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const poll = await prisma.poll.findFirst({
      where: {
        id: pollId,
        messageId,
        message: {
          thread: { householdId },
        },
      },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    const analytics = transformPollAnalytics(
      poll as PrismaPollWithFullRelations
    );
    return wrapResponse(analytics);
  } catch (error) {
    logger.error(`Error getting poll analytics: ${error}`);
    throw error;
  }
}
