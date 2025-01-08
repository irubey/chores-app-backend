"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformPoll = transformPoll;
exports.transformPollWithDetails = transformPollWithDetails;
exports.transformPollOption = transformPollOption;
exports.transformPollOptionWithVotes = transformPollOptionWithVotes;
exports.transformPollVote = transformPollVote;
exports.transformPollVoteWithUser = transformPollVoteWithUser;
exports.transformPollAnalytics = transformPollAnalytics;
const userTransformer_1 = require("../userTransformer");
const eventTransformer_1 = require("../eventTransformer");
const enums_1 = require("../../../../node_modules/@irubey/chores-app-shared/dist/enums");
function isValidPollType(type) {
    return Object.values(enums_1.PollType).includes(type);
}
function isValidPollStatus(status) {
    return Object.values(enums_1.PollStatus).includes(status);
}
function validatePollData(poll) {
    if (!poll.id)
        throw new Error('Poll must have an id');
    if (!poll.messageId)
        throw new Error('Poll must have a messageId');
    if (!poll.question)
        throw new Error('Poll must have a question');
    if (!poll.pollType)
        throw new Error('Poll must have a pollType');
    if (!poll.status)
        throw new Error('Poll must have a status');
}
function transformPoll(poll) {
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
function transformPollWithDetails(poll) {
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
            ? (0, eventTransformer_1.transformEvent)(poll.event)
            : undefined,
    };
}
function transformPollOption(option) {
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
function validatePollOptionData(option) {
    if (!option.id)
        throw new Error('Poll option must have an id');
    if (!option.pollId)
        throw new Error('Poll option must have a pollId');
    if (!option.text)
        throw new Error('Poll option must have text');
    if (typeof option.order !== 'number')
        throw new Error('Poll option must have an order');
    if (!option.votes)
        throw new Error('Poll option must have votes array');
}
function transformPollMinimal(poll) {
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
function transformPollOptionWithVotes(option) {
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
            user: (0, userTransformer_1.transformUser)(vote.user),
        })),
        voteCount: option.votes.length,
        selectedForPolls: option.selectedForPolls?.map(transformPollMinimal) || undefined,
    };
}
function transformPollVote(vote) {
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
function transformPollVoteWithUser(vote) {
    if (!vote.user) {
        throw new Error('PollVote must have a user');
    }
    return {
        ...transformPollVote(vote),
        user: (0, userTransformer_1.transformUser)(vote.user),
    };
}
function transformPollAnalytics(poll) {
    return {
        totalVotes: poll.options.reduce((sum, option) => sum + option.votes.length, 0),
        optionStats: poll.options.map((option) => ({
            optionId: option.id,
            text: option.text,
            voteCount: option.votes.length,
            percentage: (option.votes.length /
                poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)) *
                100,
        })),
    };
}
