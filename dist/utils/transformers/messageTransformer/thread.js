"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformThread = transformThread;
exports.transformThreadWithDetails = transformThreadWithDetails;
exports.transformThreadWithMessages = transformThreadWithMessages;
exports.transformThreadWithParticipants = transformThreadWithParticipants;
const userTransformer_1 = require("../userTransformer");
const householdTransformer_1 = require("../householdTransformer");
const message_1 = require("./message");
function transformThread(thread) {
    return {
        id: thread.id,
        householdId: thread.householdId,
        authorId: thread.authorId,
        title: thread.title ?? undefined,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        deletedAt: thread.deletedAt ?? undefined,
    };
}
function transformThreadWithDetails(thread) {
    if (!thread.author) {
        throw new Error('Thread must have an author');
    }
    if (!thread.household) {
        throw new Error('Thread must have a household');
    }
    const threadForMessage = {
        id: thread.id,
        householdId: thread.householdId,
        authorId: thread.authorId,
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        deletedAt: thread.deletedAt,
    };
    return {
        ...transformThread(thread),
        author: (0, userTransformer_1.transformUser)(thread.author),
        household: (0, householdTransformer_1.transformHousehold)(thread.household),
        messages: thread.messages?.map((message) => (0, message_1.transformMessageWithDetails)({
            ...message,
            thread: threadForMessage,
        })) || [],
        participants: thread.participants?.map(householdTransformer_1.transformHouseholdMember) || [],
    };
}
function transformThreadWithMessages(thread) {
    return {
        ...transformThread(thread),
        messages: thread.messages?.map(message_1.transformMessage) || [],
    };
}
function transformThreadWithParticipants(thread) {
    return {
        ...transformThread(thread),
        participants: thread.participants?.map(householdTransformer_1.transformHouseholdMember) || [],
    };
}
