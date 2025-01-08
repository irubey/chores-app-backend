"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = getMessages;
exports.createMessage = createMessage;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
exports.markMessageAsRead = markMessageAsRead;
exports.getMessageReadStatus = getMessageReadStatus;
const errorHandler_1 = require("../../middlewares/errorHandler");
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = __importDefault(require("../../utils/logger"));
const sockets_1 = require("../../sockets");
const authService_1 = require("../authService");
const messageTransformer_1 = require("../../utils/transformers/messageTransformer");
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const servicesUtils_1 = require("../../utils/servicesUtils");
/**
 * Get messages for a thread with pagination
 */
async function getMessages(householdId, threadId, userId, options = {}) {
    logger_1.default.info(`Fetching messages for thread ${threadId}`);
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const messages = await database_1.default.message.findMany({
            where: {
                threadId,
                deletedAt: null,
            },
            take: options?.limit || 20,
            skip: options?.cursor ? 1 : 0,
            cursor: options?.cursor ? { id: options.cursor } : undefined,
            orderBy: {
                [options?.sortBy || "createdAt"]: options?.direction || "desc",
            },
            include: {
                thread: true,
                author: {
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
                    },
                },
                mentions: {
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
                        message: {
                            include: {
                                thread: true,
                            },
                        },
                    },
                },
                reads: {
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
                        message: {
                            include: {
                                thread: true,
                            },
                        },
                    },
                },
            },
        });
        const lastMessage = messages[messages.length - 1];
        const hasMore = messages.length === (options?.limit || 20);
        logger_1.default.info("Successfully retrieved messages", {
            threadId,
            messageCount: messages.length,
            hasMore,
            lastMessageId: lastMessage?.id,
        });
        return (0, servicesUtils_1.wrapResponse)(messages.map((msg) => (0, messageTransformer_1.transformMessageWithDetails)(msg)), {
            hasMore,
            nextCursor: hasMore ? lastMessage?.id : undefined,
            total: messages.length,
        });
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "fetch messages", { threadId });
    }
}
/**
 * Create a new message
 */
async function createMessage(householdId, threadId, data, userId) {
    try {
        logger_1.default.info(`Creating message in thread ${threadId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const message = await database_1.default.$transaction(async (tx) => {
            const newMessage = await tx.message.create({
                data: {
                    threadId,
                    authorId: userId,
                    content: data.content,
                },
                include: {
                    thread: true,
                    author: {
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
                        },
                    },
                    mentions: {
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
                            message: {
                                include: {
                                    thread: true,
                                },
                            },
                        },
                    },
                    reads: {
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
                            message: {
                                include: {
                                    thread: true,
                                },
                            },
                        },
                    },
                },
            });
            await tx.thread.update({
                where: { id: threadId },
                data: { updatedAt: new Date() },
            });
            return newMessage;
        });
        const transformedMessage = (0, messageTransformer_1.transformMessageWithDetails)(message);
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit("message_update", {
            action: enums_1.MessageAction.CREATED,
            message: transformedMessage,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedMessage);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "create message", { threadId });
    }
}
/**
 * Update an existing message
 */
async function updateMessage(householdId, threadId, messageId, data, userId) {
    try {
        logger_1.default.info(`Updating message ${messageId}`);
        const message = await database_1.default.message.findUnique({
            where: { id: messageId },
            include: { author: true },
        });
        if (!message) {
            throw new errorHandler_1.NotFoundError("Message not found");
        }
        if (message.authorId !== userId) {
            await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
        }
        const updatedMessage = await database_1.default.message.update({
            where: { id: messageId },
            data: {
                content: data.content,
                updatedAt: new Date(),
            },
            include: {
                thread: true,
                author: {
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
                    },
                },
                mentions: {
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
                        message: {
                            include: {
                                thread: true,
                            },
                        },
                    },
                },
                reads: {
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
                        message: {
                            include: {
                                thread: true,
                            },
                        },
                    },
                },
            },
        });
        const transformedMessage = (0, messageTransformer_1.transformMessageWithDetails)(updatedMessage);
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit("message_update", {
            action: enums_1.MessageAction.UPDATED,
            message: transformedMessage,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedMessage);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "update message", { messageId });
    }
}
/**
 * Delete a message (soft delete)
 */
async function deleteMessage(householdId, threadId, messageId, userId) {
    try {
        logger_1.default.info(`Deleting message ${messageId}`);
        const message = await database_1.default.message.findUnique({
            where: { id: messageId },
            include: { author: true },
        });
        if (!message) {
            throw new errorHandler_1.NotFoundError("Message not found");
        }
        if (message.authorId !== userId) {
            await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
        }
        await database_1.default.message.update({
            where: { id: messageId },
            data: { deletedAt: new Date() },
        });
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit("message_update", {
            action: enums_1.MessageAction.DELETED,
            messageId,
        });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "delete message", { messageId });
    }
}
/**
 * Mark a message as read
 */
async function markMessageAsRead(householdId, messageId, userId) {
    try {
        logger_1.default.info(`Marking message ${messageId} as read by user ${userId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        await database_1.default.messageRead.upsert({
            where: {
                userId_messageId: {
                    userId,
                    messageId,
                },
            },
            create: {
                userId,
                messageId,
                readAt: new Date(),
            },
            update: {},
        });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "mark message as read", {
            messageId,
        });
    }
}
/**
 * Get message read status
 */
async function getMessageReadStatus(householdId, messageId, userId) {
    try {
        logger_1.default.info(`Getting read status for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const thread = await database_1.default.message.findUnique({
            where: { id: messageId },
            select: {
                thread: {
                    select: {
                        participants: {
                            select: { userId: true },
                        },
                    },
                },
                reads: {
                    select: {
                        userId: true,
                        readAt: true,
                    },
                },
            },
        });
        if (!thread) {
            throw new errorHandler_1.NotFoundError("Message not found");
        }
        const participantIds = thread.thread.participants.map((p) => p.userId);
        const readBy = thread.reads.map((r) => ({
            userId: r.userId,
            readAt: r.readAt,
        }));
        const readUserIds = readBy.map((r) => r.userId);
        const unreadBy = participantIds.filter((id) => !readUserIds.includes(id));
        return (0, servicesUtils_1.wrapResponse)({
            messageId,
            readBy,
            unreadBy,
        });
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "get message read status", {
            messageId,
        });
    }
}
