import {
  Poll,
  PollOption,
  PollVote,
  PollWithDetails,
  PollOptionWithVotes,
  PollVoteWithUser,
} from "@shared/types";
import {
  PrismaPollWithFullRelations,
  PrismaPollOptionWithFullRelations,
  PrismaPollVoteWithFullRelations,
} from "../transformerPrismaTypes";
import { transformUser } from "../userTransformer";
import { transformEvent } from "../eventTransformer";

export function transformPoll(poll: PrismaPollWithFullRelations): Poll {
  return {
    id: poll.id,
    messageId: poll.messageId,
    question: poll.question,
    pollType: poll.pollType,
    maxChoices: poll.maxChoices ?? undefined,
    maxRank: poll.maxRank ?? undefined,
    endDate: poll.endDate ?? undefined,
    eventId: poll.eventId ?? undefined,
    status: poll.status,
    selectedOptionId: poll.selectedOptionId ?? undefined,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };
}

export function transformPollWithDetails(
  poll: PrismaPollWithFullRelations
): PollWithDetails {
  return {
    ...transformPoll(poll),
    options: poll.options.map(transformPollOptionWithVotes),
    selectedOption: poll.selectedOption
      ? transformPollOptionWithVotes(poll.selectedOption)
      : undefined,
    event: poll.event ? transformEvent(poll.event) : undefined,
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

export function transformPollOptionWithVotes(
  option: PrismaPollOptionWithFullRelations
): PollOptionWithVotes {
  return {
    ...transformPollOption(option),
    votes: option.votes.map(transformPollVoteWithUser),
    voteCount: option.votes.length,
    selectedForPolls: option.selectedForPolls?.map(transformPoll) || undefined,
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
    throw new Error("PollVote must have a user");
  }

  return {
    ...transformPollVote(vote),
    user: transformUser(vote.user),
  };
}
