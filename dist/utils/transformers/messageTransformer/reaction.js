"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformReaction = transformReaction;
exports.transformReactionWithUser = transformReactionWithUser;
exports.transformReactionAnalytics = transformReactionAnalytics;
const enums_1 = require("../../../../node_modules/@irubey/chores-app-shared/dist/enums");
const userTransformer_1 = require("../userTransformer");
function isValidReactionType(type) {
    return Object.values(enums_1.ReactionType).includes(type);
}
function transformReaction(reaction) {
    return {
        id: reaction.id,
        messageId: reaction.messageId,
        userId: reaction.userId,
        emoji: reaction.emoji,
        type: isValidReactionType(reaction.type)
            ? reaction.type
            : enums_1.ReactionType.LIKE,
        createdAt: reaction.createdAt,
    };
}
function transformReactionWithUser(reaction) {
    if (!reaction.user) {
        throw new Error('Reaction must have a user');
    }
    if (!reaction.message) {
        throw new Error('Reaction must have a message');
    }
    return {
        ...transformReaction(reaction),
        user: (0, userTransformer_1.transformUser)(reaction.user),
    };
}
function transformReactionAnalytics(analytics) {
    return Object.values(enums_1.ReactionType).reduce((acc, type) => ({
        ...acc,
        [type]: analytics.find((a) => a.type === type)?._count.type || 0,
    }), {});
}
