"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReaction = addReaction;
exports.removeReaction = removeReaction;
exports.getMessageReactions = getMessageReactions;
exports.getReactionAnalytics = getReactionAnalytics;
exports.getReactionsByType = getReactionsByType;
const errorHandler_1 = require("../../middlewares/errorHandler");
const database_1 = __importDefault(require("../../config/database"));
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const sockets_1 = require("../../sockets");
const authService_1 = require("../authService");
const messageTransformer_1 = require("../../utils/transformers/messageTransformer");
const logger_1 = __importDefault(require("../../utils/logger"));
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
// First, let's create a consistent include object for reactions
const reactionInclude = {
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
    message: {
        include: {
            thread: true,
        },
    },
};
/**
 * Add a reaction to a message
 */
async function addReaction(householdId, messageId, userId, data) {
    try {
        logger_1.default.info(`Adding reaction to message ${messageId} by user ${userId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const reaction = await database_1.default.$transaction(async (tx) => {
            // Check if message exists and belongs to the household
            const message = await tx.message.findFirst({
                where: {
                    id: messageId,
                    thread: {
                        householdId,
                    },
                },
                include: {
                    thread: true,
                },
            });
            if (!message) {
                throw new errorHandler_1.NotFoundError('Message not found');
            }
            // Check for existing reaction from this user with same type
            const existingReaction = await tx.reaction.findFirst({
                where: {
                    messageId,
                    userId,
                    type: data.type,
                },
            });
            if (existingReaction) {
                throw new Error('User has already reacted with this reaction type');
            }
            // Create new reaction
            const newReaction = await tx.reaction.create({
                data: {
                    messageId,
                    userId,
                    type: data.type,
                    emoji: data.emoji,
                },
                include: reactionInclude,
            });
            // Update thread's updatedAt timestamp
            await tx.thread.update({
                where: { id: message.threadId },
                data: { updatedAt: new Date() },
            });
            return newReaction;
        });
        const transformedReaction = (0, messageTransformer_1.transformReactionWithUser)(reaction);
        // Emit socket event
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('reaction_update', {
            action: enums_1.MessageAction.REACTION_ADDED,
            messageId,
            reaction: transformedReaction,
        });
        return wrapResponse(transformedReaction);
    }
    catch (error) {
        logger_1.default.error(`Error adding reaction: ${error}`);
        throw error;
    }
}
/**
 * Remove a reaction from a message
 */
async function removeReaction(householdId, messageId, reactionId, userId) {
    try {
        logger_1.default.info(`Removing reaction ${reactionId} from message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        await database_1.default.$transaction(async (tx) => {
            const reaction = await tx.reaction.findUnique({
                where: { id: reactionId },
                include: reactionInclude,
            });
            if (!reaction) {
                throw new errorHandler_1.NotFoundError('Reaction not found');
            }
            if (reaction.userId !== userId) {
                throw new errorHandler_1.UnauthorizedError('Cannot remove another user\'s reaction');
            }
            if (reaction.message.thread.householdId !== householdId) {
                throw new errorHandler_1.UnauthorizedError('Reaction does not belong to this household');
            }
            await tx.reaction.delete({
                where: { id: reactionId },
            });
            // Update thread's updatedAt timestamp
            await tx.thread.update({
                where: { id: reaction.message.threadId },
                data: { updatedAt: new Date() },
            });
        });
        // Emit socket event
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('reaction_update', {
            action: enums_1.MessageAction.REACTION_REMOVED,
            messageId,
            reactionId,
        });
        return wrapResponse(undefined);
    }
    catch (error) {
        logger_1.default.error(`Error removing reaction: ${error}`);
        throw error;
    }
}
/**
 * Get all reactions for a message
 */
async function getMessageReactions(householdId, messageId, userId) {
    try {
        logger_1.default.info(`Getting reactions for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const reactions = await database_1.default.reaction.findMany({
            where: {
                messageId,
                message: {
                    thread: {
                        householdId,
                    },
                },
            },
            include: reactionInclude,
            orderBy: {
                createdAt: 'asc',
            },
        });
        const transformedReactions = reactions.map((reaction) => (0, messageTransformer_1.transformReactionWithUser)(reaction));
        return wrapResponse(transformedReactions);
    }
    catch (error) {
        logger_1.default.error(`Error getting message reactions: ${error}`);
        throw error;
    }
}
/**
 * Get reaction analytics for a message
 */
async function getReactionAnalytics(householdId, messageId, userId) {
    try {
        logger_1.default.info(`Getting reaction analytics for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const reactions = await database_1.default.reaction.groupBy({
            by: ['type'],
            where: {
                messageId,
                message: {
                    thread: {
                        householdId,
                    },
                },
            },
            _count: {
                type: true,
            },
        });
        const analytics = Object.values(enums_1.ReactionType).reduce((acc, type) => ({
            ...acc,
            [type]: reactions.find((r) => r.type === type)?._count.type || 0,
        }), {});
        return wrapResponse(analytics);
    }
    catch (error) {
        logger_1.default.error(`Error getting reaction analytics: ${error}`);
        throw error;
    }
}
/**
 * Get reactions by type for a message
 */
async function getReactionsByType(householdId, messageId, type, userId) {
    try {
        logger_1.default.info(`Getting reactions of type ${type} for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const reactions = await database_1.default.reaction.findMany({
            where: {
                messageId,
                type,
                message: {
                    thread: {
                        householdId,
                    },
                },
            },
            include: reactionInclude,
            orderBy: {
                createdAt: 'asc',
            },
        });
        const transformedReactions = reactions.map((reaction) => (0, messageTransformer_1.transformReactionWithUser)(reaction));
        return wrapResponse(transformedReactions);
    }
    catch (error) {
        logger_1.default.error(`Error getting reactions by type: ${error}`);
        throw error;
    }
}
