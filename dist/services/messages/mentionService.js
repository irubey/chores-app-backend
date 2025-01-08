"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMention = createMention;
exports.getUserMentions = getUserMentions;
exports.getMessageMentions = getMessageMentions;
exports.deleteMention = deleteMention;
exports.getUnreadMentionsCount = getUnreadMentionsCount;
const errorHandler_1 = require("../../middlewares/errorHandler");
const database_1 = __importDefault(require("../../config/database"));
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const sockets_1 = require("../../sockets");
const authService_1 = require("../authService");
const messageTransformer_1 = require("../../utils/transformers/messageTransformer");
const notificationService_1 = require("../notificationService");
const logger_1 = __importDefault(require("../../utils/logger"));
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
/**
 * Creates a new mention for a message
 */
async function createMention(householdId, messageId, data, userId) {
    try {
        logger_1.default.info(`Creating mention in message ${messageId} for user ${data.userId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        // Verify the mentioned user is a member of the household
        await (0, authService_1.verifyMembership)(householdId, data.userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const mention = await database_1.default.$transaction(async (tx) => {
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
                    author: true,
                },
            });
            if (!message) {
                throw new errorHandler_1.NotFoundError('Message not found');
            }
            // Create the mention
            const newMention = await tx.mention.create({
                data: {
                    messageId,
                    userId: data.userId,
                    mentionedAt: new Date(),
                },
                include: {
                    message: {
                        include: {
                            thread: true,
                        },
                    },
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
            });
            // Create notification for mentioned user
            await (0, notificationService_1.createNotification)({
                userId: data.userId,
                type: enums_1.NotificationType.NEW_MESSAGE,
                message: `${message.author.name} mentioned you in ${message.thread.title || 'a message'}`,
            });
            return newMention;
        });
        const transformedMention = (0, messageTransformer_1.transformMentionWithUser)(mention);
        // Emit socket event
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('mention_update', {
            action: enums_1.MessageAction.MENTIONED,
            messageId,
            mention: transformedMention,
        });
        return wrapResponse(transformedMention);
    }
    catch (error) {
        logger_1.default.error(`Error creating mention: ${error}`);
        throw error;
    }
}
/**
 * Gets all mentions for a specific user in a household
 */
async function getUserMentions(householdId, userId, includeRead = false) {
    try {
        logger_1.default.info(`Getting mentions for user ${userId} in household ${householdId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const mentions = await database_1.default.mention.findMany({
            where: {
                userId,
                message: {
                    thread: {
                        householdId,
                    },
                },
            },
            include: {
                message: {
                    include: {
                        thread: true,
                    },
                },
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
            orderBy: {
                mentionedAt: 'desc',
            },
        });
        const transformedMentions = mentions.map((mention) => (0, messageTransformer_1.transformMentionWithUser)(mention));
        return wrapResponse(transformedMentions);
    }
    catch (error) {
        logger_1.default.error(`Error getting user mentions: ${error}`);
        throw error;
    }
}
/**
 * Gets all mentions in a specific message
 */
async function getMessageMentions(householdId, messageId, userId) {
    try {
        logger_1.default.info(`Getting mentions for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const mentions = await database_1.default.mention.findMany({
            where: {
                messageId,
                message: {
                    thread: {
                        householdId,
                    },
                },
            },
            include: {
                message: {
                    include: {
                        thread: true,
                    },
                },
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
            orderBy: {
                mentionedAt: 'desc',
            },
        });
        const transformedMentions = mentions.map((mention) => (0, messageTransformer_1.transformMentionWithUser)(mention));
        return wrapResponse(transformedMentions);
    }
    catch (error) {
        logger_1.default.error(`Error getting message mentions: ${error}`);
        throw error;
    }
}
/**
 * Deletes a mention
 */
async function deleteMention(householdId, messageId, mentionId, userId) {
    try {
        logger_1.default.info(`Deleting mention ${mentionId}`);
        const mention = await database_1.default.mention.findUnique({
            where: { id: mentionId },
            include: {
                message: {
                    include: {
                        author: true,
                        thread: true,
                    },
                },
            },
        });
        if (!mention) {
            throw new errorHandler_1.NotFoundError('Mention not found');
        }
        // Only message author or admin can delete mentions
        if (mention.message.authorId !== userId) {
            await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
        }
        await database_1.default.mention.delete({
            where: { id: mentionId },
        });
        // Emit socket event
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('mention_update', {
            action: enums_1.MessageAction.MENTIONED,
            messageId,
            mentionId,
        });
        return wrapResponse(undefined);
    }
    catch (error) {
        logger_1.default.error(`Error deleting mention: ${error}`);
        throw error;
    }
}
/**
 * Gets unread mentions count for a user
 */
async function getUnreadMentionsCount(householdId, userId) {
    try {
        logger_1.default.info(`Getting unread mentions count for user ${userId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const count = await database_1.default.mention.count({
            where: {
                userId,
                message: {
                    thread: {
                        householdId,
                    },
                    reads: {
                        none: {
                            userId,
                        },
                    },
                },
            },
        });
        return wrapResponse(count);
    }
    catch (error) {
        logger_1.default.error(`Error getting unread mentions count: ${error}`);
        throw error;
    }
}
