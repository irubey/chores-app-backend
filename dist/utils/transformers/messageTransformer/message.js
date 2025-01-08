"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMessage = transformMessage;
exports.transformMessageWithDetails = transformMessageWithDetails;
const thread_1 = require("./thread");
const userTransformer_1 = require("../userTransformer");
const attachment_1 = require("./attachment");
const reaction_1 = require("./reaction");
const mention_1 = require("./mention");
const read_1 = require("./read");
const poll_1 = require("./poll");
function transformMessage(message) {
    return {
        id: message.id,
        threadId: message.threadId,
        authorId: message.authorId,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        deletedAt: message.deletedAt ?? undefined,
    };
}
function transformMessageWithDetails(message) {
    if (!message.author) {
        throw new Error('Message must have an author');
    }
    if (!message.thread) {
        throw new Error('Message must have a thread');
    }
    const baseMessage = {
        id: message.id,
        threadId: message.threadId,
        authorId: message.authorId,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        deletedAt: message.deletedAt,
    };
    return {
        ...transformMessage(message),
        thread: (0, thread_1.transformThread)(message.thread),
        author: (0, userTransformer_1.transformUser)(message.author),
        attachments: message.attachments?.map(attachment_1.transformAttachment),
        reactions: message.reactions?.map(reaction_1.transformReactionWithUser),
        mentions: message.mentions?.map(mention_1.transformMentionWithUser),
        reads: message.reads?.map(read_1.transformMessageReadWithUser),
        poll: message.poll
            ? (0, poll_1.transformPollWithDetails)(message.poll)
            : undefined,
    };
}
