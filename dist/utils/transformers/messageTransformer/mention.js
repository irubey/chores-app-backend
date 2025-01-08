"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMention = transformMention;
exports.transformMentionWithUser = transformMentionWithUser;
const userTransformer_1 = require("../userTransformer");
function validateMentionData(mention) {
    if (!mention.id) {
        throw new Error('Mention must have an id');
    }
    if (!mention.messageId) {
        throw new Error('Mention must have a messageId');
    }
    if (!mention.userId) {
        throw new Error('Mention must have a userId');
    }
    if (!mention.mentionedAt) {
        throw new Error('Mention must have a mentionedAt date');
    }
}
function transformMention(mention) {
    validateMentionData(mention);
    return {
        id: mention.id,
        messageId: mention.messageId,
        userId: mention.userId,
        mentionedAt: mention.mentionedAt,
    };
}
function transformMentionWithUser(mention) {
    validateMentionData(mention);
    if (!mention.user) {
        throw new Error('Mention must have a user');
    }
    if (!mention.message) {
        throw new Error('Mention must have a message');
    }
    return {
        ...transformMention(mention),
        user: (0, userTransformer_1.transformUser)(mention.user),
    };
}
