"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMessageRead = transformMessageRead;
exports.transformMessageReadWithUser = transformMessageReadWithUser;
const userTransformer_1 = require("../userTransformer");
function transformMessageRead(read) {
    return {
        id: read.id,
        messageId: read.messageId,
        userId: read.userId,
        readAt: read.readAt,
    };
}
function transformMessageReadWithUser(read) {
    if (!read.user) {
        throw new Error('MessageRead must have a user');
    }
    if (!read.message) {
        throw new Error('MessageRead must have a message');
    }
    return {
        ...transformMessageRead(read),
        user: (0, userTransformer_1.transformUser)(read.user),
    };
}
