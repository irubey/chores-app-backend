"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPollsInThread = getPollsInThread;
exports.getPoll = getPoll;
exports.createPoll = createPoll;
exports.updatePoll = updatePoll;
exports.deletePoll = deletePoll;
exports.votePoll = votePoll;
exports.removePollVote = removePollVote;
exports.getPollAnalytics = getPollAnalytics;
const errorHandler_1 = require("../../middlewares/errorHandler");
const database_1 = __importDefault(require("../../config/database"));
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const sockets_1 = require("../../sockets");
const authService_1 = require("../authService");
const messageTransformer_1 = require("../../utils/transformers/messageTransformer");
const logger_1 = __importDefault(require("../../utils/logger"));
function wrapResponse(data) {
    return { data };
}
function isValidPollStatus(status) {
    return Object.values(enums_1.PollStatus).includes(status);
}
async function getPollsInThread(householdId, threadId, userId) {
    try {
        logger_1.default.info(`Getting polls for thread ${threadId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const polls = await database_1.default.poll.findMany({
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
        const transformedPolls = polls.map((poll) => (0, messageTransformer_1.transformPollWithDetails)(poll));
        return wrapResponse(transformedPolls);
    }
    catch (error) {
        logger_1.default.error(`Error getting polls in thread: ${error}`);
        throw error;
    }
}
async function getPoll(householdId, messageId, pollId, userId) {
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const poll = await database_1.default.poll.findFirst({
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
            throw new errorHandler_1.NotFoundError('Poll not found');
        }
        return wrapResponse((0, messageTransformer_1.transformPollWithDetails)(poll));
    }
    catch (error) {
        logger_1.default.error(`Error getting poll: ${error}`);
        throw error;
    }
}
async function createPoll(householdId, messageId, data, userId) {
    try {
        logger_1.default.info(`Creating poll for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const poll = await database_1.default.$transaction(async (tx) => {
            const message = await tx.message.findFirst({
                where: {
                    id: messageId,
                    thread: { householdId },
                },
                include: { thread: true },
            });
            if (!message) {
                throw new errorHandler_1.NotFoundError('Message not found');
            }
            if (message.authorId !== userId) {
                throw new errorHandler_1.UnauthorizedError('Only message author can create polls');
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
            return newPoll;
        });
        const transformedPoll = (0, messageTransformer_1.transformPollWithDetails)(poll);
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('poll_update', {
            action: enums_1.MessageAction.POLL_CREATED,
            messageId,
            poll: transformedPoll,
        });
        return wrapResponse(transformedPoll);
    }
    catch (error) {
        logger_1.default.error(`Error creating poll: ${error}`);
        throw error;
    }
}
async function updatePoll(householdId, messageId, pollId, data, userId) {
    try {
        logger_1.default.info(`Updating poll ${pollId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const poll = await database_1.default.$transaction(async (tx) => {
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
                throw new errorHandler_1.NotFoundError('Poll not found');
            }
            if (existingPoll.message.authorId !== userId) {
                throw new errorHandler_1.UnauthorizedError('Only poll creator can update poll');
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
            return updatedPoll;
        });
        const transformedPoll = (0, messageTransformer_1.transformPollWithDetails)(poll);
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('poll_update', {
            action: enums_1.MessageAction.POLL_UPDATED,
            messageId,
            poll: transformedPoll,
        });
        return wrapResponse(transformedPoll);
    }
    catch (error) {
        logger_1.default.error(`Error updating poll: ${error}`);
        throw error;
    }
}
async function deletePoll(householdId, messageId, pollId, userId) {
    try {
        logger_1.default.info(`Deleting poll ${pollId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const poll = await database_1.default.$transaction(async (tx) => {
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
                throw new errorHandler_1.NotFoundError('Poll not found');
            }
            if (existingPoll.message.authorId !== userId) {
                throw new errorHandler_1.UnauthorizedError('Only poll creator can delete poll');
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
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('poll_update', {
            action: enums_1.MessageAction.POLL_DELETED,
            messageId,
            pollId,
        });
        return wrapResponse(undefined);
    }
    catch (error) {
        logger_1.default.error(`Error deleting poll: ${error}`);
        throw error;
    }
}
async function votePoll(householdId, messageId, pollId, data, userId) {
    try {
        logger_1.default.info(`Voting on poll ${pollId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const vote = await database_1.default.$transaction(async (tx) => {
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
                throw new errorHandler_1.NotFoundError('Poll not found');
            }
            if (poll.status !== 'OPEN') {
                throw new errorHandler_1.ValidationError('Poll is not active');
            }
            // Delete existing votes if not multiple choice
            if (poll.pollType !== enums_1.PollType.MULTIPLE_CHOICE) {
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
            return newVote;
        });
        const transformedVote = (0, messageTransformer_1.transformPollVoteWithUser)(vote);
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('poll_vote_update', {
            action: enums_1.MessageAction.POLL_VOTED,
            messageId,
            pollId,
            vote: transformedVote,
        });
        return wrapResponse(transformedVote);
    }
    catch (error) {
        logger_1.default.error(`Error voting on poll: ${error}`);
        throw error;
    }
}
async function removePollVote(householdId, messageId, pollId, voteId, userId) {
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const vote = await database_1.default.pollVote.findFirst({
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
            throw new errorHandler_1.NotFoundError('Vote not found');
        }
        await database_1.default.pollVote.delete({
            where: { id: voteId },
        });
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('poll_vote_update', {
            action: enums_1.MessageAction.POLL_VOTE_REMOVED,
            messageId,
            pollId,
            voteId,
        });
        return wrapResponse(undefined);
    }
    catch (error) {
        logger_1.default.error(`Error deleting vote: ${error}`);
        throw error;
    }
}
async function getPollAnalytics(householdId, messageId, pollId, userId) {
    try {
        logger_1.default.info(`Getting analytics for poll ${pollId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const poll = await database_1.default.poll.findFirst({
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
            throw new errorHandler_1.NotFoundError('Poll not found');
        }
        const analytics = (0, messageTransformer_1.transformPollAnalytics)(poll);
        return wrapResponse(analytics);
    }
    catch (error) {
        logger_1.default.error(`Error getting poll analytics: ${error}`);
        throw error;
    }
}
