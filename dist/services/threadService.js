"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThreads = getThreads;
exports.createThread = createThread;
exports.getThreadById = getThreadById;
exports.updateThread = updateThread;
exports.deleteThread = deleteThread;
exports.inviteUsersToThread = inviteUsersToThread;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const authService_1 = require("./authService");
const messageTransformer_1 = require("../utils/transformers/messageTransformer");
const transformerPrismaTypes_1 = require("../utils/transformers/transformerPrismaTypes");
const logger_1 = __importDefault(require("../utils/logger"));
const servicesUtils_1 = require("../utils/servicesUtils");
// Create a constant for the message include object to avoid repetition
const messageInclude = {
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
        select: transformerPrismaTypes_1.userMinimalSelect,
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
                select: transformerPrismaTypes_1.userMinimalSelect,
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
                select: transformerPrismaTypes_1.userMinimalSelect,
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
                select: transformerPrismaTypes_1.userMinimalSelect,
            },
            message: {
                include: {
                    thread: true,
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
                                select: transformerPrismaTypes_1.userMinimalSelect,
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
                                select: transformerPrismaTypes_1.userMinimalSelect,
                            },
                        },
                    },
                    selectedForPolls: true,
                },
            },
        },
    },
};
/**
 * Retrieves all threads for a specific household.
 */
async function getThreads(householdId, userId, options) {
    logger_1.default.debug("Fetching threads for household", {
        householdId,
        userId,
        options,
    });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const threads = await database_1.default.thread.findMany({
            where: { householdId },
            take: options?.limit || 20,
            skip: options?.cursor ? 1 : 0,
            cursor: options?.cursor ? { id: options.cursor } : undefined,
            orderBy: {
                [options?.sortBy || "updatedAt"]: options?.direction || "desc",
            },
            include: {
                author: {
                    select: transformerPrismaTypes_1.userMinimalSelect,
                },
                household: true,
                messages: {
                    take: 20,
                    orderBy: { createdAt: "desc" },
                    where: { deletedAt: null },
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
                            select: transformerPrismaTypes_1.userMinimalSelect,
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
                                    select: transformerPrismaTypes_1.userMinimalSelect,
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
                                    select: transformerPrismaTypes_1.userMinimalSelect,
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
                                    select: transformerPrismaTypes_1.userMinimalSelect,
                                },
                                message: {
                                    include: {
                                        thread: true,
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
                                                    select: transformerPrismaTypes_1.userMinimalSelect,
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
                                                    select: transformerPrismaTypes_1.userMinimalSelect,
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
        logger_1.default.info("Successfully retrieved threads", {
            householdId,
            threadCount: threads.length,
            hasMore,
            lastThreadId: lastThread?.id,
        });
        return (0, servicesUtils_1.wrapResponse)(threads.map(messageTransformer_1.transformThreadWithDetails));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "fetch threads", { householdId });
    }
}
/**
 * Creates a new thread.
 */
async function createThread(data, userId) {
    logger_1.default.debug("Creating new thread", {
        householdId: data.householdId,
        userId,
    });
    try {
        const thread = await database_1.default.$transaction(async (tx) => {
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
                        select: transformerPrismaTypes_1.userMinimalSelect,
                    },
                    household: true,
                    messages: {
                        include: messageInclude,
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
        logger_1.default.info("Successfully created thread", {
            threadId: thread.id,
            householdId: data.householdId,
        });
        const transformedThread = (0, messageTransformer_1.transformThreadWithDetails)(thread);
        (0, servicesUtils_1.emitThreadEvent)("thread_update", thread.id, data.householdId, {
            action: enums_1.ThreadAction.CREATED,
            thread: transformedThread,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedThread);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "create thread");
    }
}
/**
 * Retrieves details of a specific thread.
 */
async function getThreadById(householdId, threadId, userId) {
    logger_1.default.debug("Fetching thread by ID", { householdId, threadId, userId });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const thread = await database_1.default.thread.findUnique({
            where: { id: threadId },
            include: {
                author: {
                    select: transformerPrismaTypes_1.userMinimalSelect,
                },
                household: true,
                messages: {
                    include: messageInclude,
                },
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!thread) {
            logger_1.default.warn("Thread not found", { threadId });
            throw new errorHandler_1.NotFoundError("Thread not found");
        }
        logger_1.default.info("Successfully retrieved thread", { threadId });
        return (0, servicesUtils_1.wrapResponse)((0, messageTransformer_1.transformThreadWithDetails)(thread));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "fetch thread by ID", {
            threadId,
        });
    }
}
/**
 * Updates an existing thread.
 */
async function updateThread(householdId, threadId, data, userId) {
    logger_1.default.debug("Updating thread", { householdId, threadId, userId });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const updatedThread = await database_1.default.$transaction(async (tx) => {
            if (data.participants?.add?.length) {
                const householdMembers = await tx.householdMember.findMany({
                    where: {
                        householdId,
                        userId: { in: data.participants.add },
                    },
                });
                if (householdMembers.length !== data.participants.add.length) {
                    throw new errorHandler_1.UnauthorizedError("Some users are not members of this household");
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
                        select: transformerPrismaTypes_1.userMinimalSelect,
                    },
                    household: true,
                    messages: {
                        include: messageInclude,
                    },
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
        });
        logger_1.default.info("Successfully updated thread", { threadId });
        const transformedThread = (0, messageTransformer_1.transformThreadWithDetails)(updatedThread);
        (0, servicesUtils_1.emitThreadEvent)("thread_update", threadId, householdId, {
            action: enums_1.ThreadAction.UPDATED,
            thread: transformedThread,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedThread);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "update thread", { threadId });
    }
}
/**
 * Deletes a thread.
 */
async function deleteThread(householdId, threadId, userId) {
    logger_1.default.debug("Deleting thread", { householdId, threadId, userId });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
        await database_1.default.thread.delete({ where: { id: threadId } });
        logger_1.default.info("Successfully deleted thread", { threadId });
        (0, servicesUtils_1.emitThreadEvent)("thread_update", threadId, householdId, {
            action: enums_1.ThreadAction.DELETED,
            threadId,
        });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "delete thread", { threadId });
    }
}
/**
 * Invites users to a thread.
 */
async function inviteUsersToThread(householdId, threadId, data, userId) {
    logger_1.default.debug("Inviting users to thread", {
        householdId,
        threadId,
        userIds: data.userIds,
        requestingUserId: userId,
    });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const updatedThread = await database_1.default.$transaction(async (tx) => {
            const householdMembers = await tx.householdMember.findMany({
                where: {
                    householdId,
                    userId: { in: data.userIds },
                },
            });
            if (householdMembers.length !== data.userIds.length) {
                throw new errorHandler_1.UnauthorizedError("Some users are not members of this household");
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
                        select: transformerPrismaTypes_1.userMinimalSelect,
                    },
                    household: true,
                    messages: {
                        include: messageInclude,
                    },
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
        });
        logger_1.default.info("Successfully invited users to thread", {
            threadId,
            invitedUserCount: data.userIds.length,
        });
        const transformedThread = (0, messageTransformer_1.transformThreadWithDetails)(updatedThread);
        (0, servicesUtils_1.emitThreadEvent)("thread_update", threadId, householdId, {
            action: enums_1.ThreadAction.USERS_INVITED,
            thread: transformedThread,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedThread);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "invite users to thread", {
            threadId,
        });
    }
}
