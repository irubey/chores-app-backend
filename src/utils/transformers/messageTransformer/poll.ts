import {
  Poll,
  PollOption,
  PollVote,
  PollWithDetails,
  PollOptionWithVotes,
  PollVoteWithUser,
} from '@shared/types';
import {
  PrismaPollWithFullRelations,
  PrismaPollOptionWithFullRelations,
  PrismaPollVoteWithFullRelations,
  PrismaPollBase,
  PrismaEventWithFullRelations,
} from '../transformerPrismaTypes';
import { transformUser } from '../userTransformer';
import { transformEvent } from '../eventTransformer';
import { PollStatus, PollType } from '@shared/enums';

function isValidPollType(type: string): type is PollType {
  return Object.values(PollType).includes(type as PollType);
}

function isValidPollStatus(status: string): status is PollStatus {
  return Object.values(PollStatus).includes(status as PollStatus);
}

function validatePollData(poll: PrismaPollWithFullRelations): void {
  if (!poll.id) throw new Error('Poll must have an id');
  if (!poll.messageId) throw new Error('Poll must have a messageId');
  if (!poll.question) throw new Error('Poll must have a question');
  if (!poll.pollType) throw new Error('Poll must have a pollType');
  if (!poll.status) throw new Error('Poll must have a status');
}

export function transformPoll(poll: PrismaPollWithFullRelations): Poll {
  validatePollData(poll);

  if (!isValidPollType(poll.pollType)) {
    throw new Error(`Invalid poll type: ${poll.pollType}`);
  }

  if (!isValidPollStatus(poll.status)) {
    throw new Error(`Invalid poll status: ${poll.status}`);
  }

  return {
    id: poll.id,
    messageId: poll.messageId,
    question: poll.question,
    pollType: poll.pollType as PollType,
    maxChoices: poll.maxChoices ?? undefined,
    maxRank: poll.maxRank ?? undefined,
    endDate: poll.endDate ?? undefined,
    eventId: poll.eventId ?? undefined,
    status: poll.status as PollStatus,
    selectedOptionId: poll.selectedOptionId ?? undefined,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };
}

export function transformPollWithDetails(
  poll: PrismaPollWithFullRelations
): PollWithDetails {
  validatePollData(poll);

  if (!poll.options) {
    throw new Error('Poll must have options array');
  }

  const pollData = {
    id: poll.id,
    messageId: poll.messageId,
    question: poll.question,
    pollType: poll.pollType,
    maxChoices: poll.maxChoices,
    maxRank: poll.maxRank,
    endDate: poll.endDate,
    eventId: poll.eventId,
    status: poll.status,
    selectedOptionId: poll.selectedOptionId,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };

  const transformedPoll = transformPoll(poll);
  const transformedOptions = poll.options.map((option) => {
    if (!option.votes) {
      throw new Error('Poll option must have votes array');
    }
    return transformPollOptionWithVotes({
      ...option,
      poll: pollData,
    });
  });

  return {
    ...transformedPoll,
    options: transformedOptions,
    selectedOption: poll.selectedOption
      ? transformPollOptionWithVotes({
        ...poll.selectedOption,
        poll: pollData,
      })
      : undefined,
    event: poll.event
      ? transformEvent(poll.event as PrismaEventWithFullRelations)
      : undefined,
  };
}

export function transformPollOption(
  option: PrismaPollOptionWithFullRelations
): PollOption {
  return {
    id: option.id,
    pollId: option.pollId,
    text: option.text,
    order: option.order,
    startTime: option.startTime ?? undefined,
    endTime: option.endTime ?? undefined,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt,
  };
}

function validatePollOptionData(
  option: PrismaPollOptionWithFullRelations
): void {
  if (!option.id) throw new Error('Poll option must have an id');
  if (!option.pollId) throw new Error('Poll option must have a pollId');
  if (!option.text) throw new Error('Poll option must have text');
  if (typeof option.order !== 'number')
    throw new Error('Poll option must have an order');
  if (!option.votes) throw new Error('Poll option must have votes array');
}

function transformPollMinimal(poll: PrismaPollBase): Poll {
  if (!isValidPollType(poll.pollType)) {
    throw new Error(`Invalid poll type: ${poll.pollType}`);
  }

  if (!isValidPollStatus(poll.status)) {
    throw new Error(`Invalid poll status: ${poll.status}`);
  }

  return {
    id: poll.id,
    messageId: poll.messageId,
    question: poll.question,
    pollType: poll.pollType as PollType,
    maxChoices: poll.maxChoices ?? undefined,
    maxRank: poll.maxRank ?? undefined,
    endDate: poll.endDate ?? undefined,
    eventId: poll.eventId ?? undefined,
    status: poll.status as PollStatus,
    selectedOptionId: poll.selectedOptionId ?? undefined,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };
}

export function transformPollOptionWithVotes(
  option: PrismaPollOptionWithFullRelations
): PollOptionWithVotes {
  validatePollOptionData(option);

  return {
    ...transformPollOption(option),
    votes: option.votes.map((vote) => ({
      id: vote.id,
      optionId: vote.optionId,
      pollId: vote.pollId,
      userId: vote.userId,
      rank: vote.rank ?? undefined,
      availability: vote.availability ?? undefined,
      createdAt: vote.createdAt,
      user: transformUser(vote.user),
    })),
    voteCount: option.votes.length,
    selectedForPolls:
      option.selectedForPolls?.map(transformPollMinimal) || undefined,
  };
}

export function transformPollVote(
  vote: PrismaPollVoteWithFullRelations
): PollVote {
  return {
    id: vote.id,
    optionId: vote.optionId,
    pollId: vote.pollId,
    userId: vote.userId,
    rank: vote.rank ?? undefined,
    availability: vote.availability ?? undefined,
    createdAt: vote.createdAt,
  };
}

export function transformPollVoteWithUser(
  vote: PrismaPollVoteWithFullRelations
): PollVoteWithUser {
  if (!vote.user) {
    throw new Error('PollVote must have a user');
  }

  return {
    ...transformPollVote(vote),
    user: transformUser(vote.user),
  };
}

export function transformPollAnalytics(poll: PrismaPollWithFullRelations) {
  return {
    totalVotes: poll.options.reduce(
      (sum, option) => sum + option.votes.length,
      0
    ),
    optionStats: poll.options.map((option) => ({
      optionId: option.id,
      text: option.text,
      voteCount: option.votes.length,
      percentage:
        (option.votes.length /
          poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)) *
        100,
    })),
  };
}
