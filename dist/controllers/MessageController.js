"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const messageService = __importStar(require("../services/messages/messageService"));
const attachmentService = __importStar(require("../services/messages/attachmentService"));
const mentionService = __importStar(require("../services/messages/mentionService"));
const reactionService = __importStar(require("../services/messages/reactionService"));
const pollService = __importStar(require("../services/messages/pollService"));
/**
 * MessageController handles all service operations related to messages.
 */
class MessageController {
    /**
     * Message related endpoints
     */
    static async getMessages(req, res, next) {
        try {
            const { householdId, threadId } = req.params;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const { cursor, limit } = req.query;
            const paginationOptions = {
                cursor: cursor,
                limit: limit ? parseInt(limit) : undefined,
            };
            const response = await messageService.getMessages(householdId, threadId, req.user.id, paginationOptions);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async createMessage(req, res, next) {
        try {
            const { householdId, threadId } = req.params;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const response = await messageService.createMessage(householdId, threadId, req.body, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMessage(req, res, next) {
        try {
            const { householdId, threadId, messageId } = req.params;
            if (!householdId || !threadId || !messageId) {
                throw new Error("Missing required parameters: householdId, threadId, and messageId");
            }
            const response = await messageService.updateMessage(householdId, threadId, messageId, req.body, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteMessage(req, res, next) {
        try {
            const { householdId, threadId, messageId } = req.params;
            if (!householdId || !threadId || !messageId) {
                throw new Error("Missing required parameters: householdId, threadId, and messageId");
            }
            const response = await messageService.deleteMessage(householdId, threadId, messageId, req.user.id);
            res.status(204).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async markMessageAsRead(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await messageService.markMessageAsRead(householdId, messageId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getMessageReadStatus(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await messageService.getMessageReadStatus(householdId, messageId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Attachment related endpoints
     */
    static async addAttachment(req, res, next) {
        try {
            const { householdId, threadId, messageId } = req.params;
            if (!householdId || !threadId || !messageId) {
                throw new Error("Missing required parameters: householdId, threadId, and messageId");
            }
            const response = await attachmentService.addAttachment(householdId, threadId, messageId, req.body, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteAttachment(req, res, next) {
        try {
            const { householdId, threadId, messageId, attachmentId } = req.params;
            if (!householdId || !threadId || !messageId || !attachmentId) {
                throw new Error("Missing required parameters: householdId, threadId, messageId, and attachmentId");
            }
            const response = await attachmentService.deleteAttachment(householdId, threadId, messageId, attachmentId, req.user.id);
            res.status(204).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getAttachment(req, res, next) {
        try {
            const { householdId, threadId, messageId, attachmentId } = req.params;
            if (!householdId || !threadId || !messageId || !attachmentId) {
                throw new Error("Missing required parameters: householdId, threadId, messageId, and attachmentId");
            }
            const response = await attachmentService.getAttachment(householdId, threadId, messageId, attachmentId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getMessageAttachments(req, res, next) {
        try {
            const { householdId, threadId, messageId } = req.params;
            if (!householdId || !threadId || !messageId) {
                throw new Error("Missing required parameters: householdId, threadId, and messageId");
            }
            const response = await attachmentService.getMessageAttachments(householdId, threadId, messageId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Mention related endpoints
     */
    static async createMention(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await mentionService.createMention(householdId, messageId, req.body, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getUserMentions(req, res, next) {
        try {
            const { householdId } = req.params;
            if (!householdId) {
                throw new Error("Missing required parameters: householdId");
            }
            const response = await mentionService.getUserMentions(householdId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getMessageMentions(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await mentionService.getMessageMentions(householdId, messageId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteMention(req, res, next) {
        try {
            const { householdId, messageId, mentionId } = req.params;
            if (!householdId || !messageId || !mentionId) {
                throw new Error("Missing required parameters: householdId, messageId, and mentionId");
            }
            const response = await mentionService.deleteMention(householdId, messageId, mentionId, req.user.id);
            res.status(204).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getUnreadMentionsCount(req, res, next) {
        try {
            const { householdId } = req.params;
            if (!householdId) {
                throw new Error("Missing required parameters: householdId");
            }
            const response = await mentionService.getUnreadMentionsCount(householdId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reaction related endpoints
     */
    static async addReaction(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await reactionService.addReaction(householdId, messageId, req.user.id, req.body);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async removeReaction(req, res, next) {
        try {
            const { householdId, messageId, reactionId } = req.params;
            if (!householdId || !messageId || !reactionId) {
                throw new Error("Missing required parameters: householdId, messageId, and reactionId");
            }
            const response = await reactionService.removeReaction(householdId, messageId, reactionId, req.user.id);
            res.status(204).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getMessageReactions(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await reactionService.getMessageReactions(householdId, messageId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getReactionAnalytics(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await reactionService.getReactionAnalytics(householdId, messageId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getReactionsByType(req, res, next) {
        try {
            const { householdId, messageId } = req.params;
            if (!householdId || !messageId) {
                throw new Error("Missing required parameters: householdId and messageId");
            }
            const response = await reactionService.getReactionsByType(householdId, messageId, req.body.type, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Poll related endpoints
     */
    static async getPollsInThread(req, res, next) {
        try {
            const { householdId, threadId } = req.params;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const response = await pollService.getPollsInThread(householdId, threadId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getPoll(req, res, next) {
        try {
            const { householdId, threadId, pollId } = req.params;
            if (!householdId || !threadId || !pollId) {
                throw new Error("Missing required parameters: householdId, threadId, and pollId");
            }
            const response = await pollService.getPoll(householdId, threadId, pollId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async createPoll(req, res, next) {
        try {
            const { householdId, threadId } = req.params;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const response = await pollService.createPoll(householdId, threadId, req.body, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePoll(req, res, next) {
        try {
            const { householdId, threadId, pollId } = req.params;
            if (!householdId || !threadId || !pollId) {
                throw new Error("Missing required parameters: householdId, threadId, and pollId");
            }
            const response = await pollService.updatePoll(householdId, threadId, pollId, req.body, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async deletePoll(req, res, next) {
        try {
            const { householdId, threadId, pollId } = req.params;
            if (!householdId || !threadId || !pollId) {
                throw new Error("Missing required parameters: householdId, threadId, and pollId");
            }
            const response = await pollService.deletePoll(householdId, threadId, pollId, req.user.id);
            res.status(204).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async votePoll(req, res, next) {
        try {
            const { householdId, threadId, pollId } = req.params;
            if (!householdId || !threadId || !pollId) {
                throw new Error("Missing required parameters: householdId, threadId, and pollId");
            }
            const response = await pollService.votePoll(householdId, threadId, pollId, req.body, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async removePollVote(req, res, next) {
        try {
            const { householdId, threadId, pollId } = req.params;
            if (!householdId || !threadId || !pollId) {
                throw new Error("Missing required parameters: householdId, threadId, and pollId");
            }
            const response = await pollService.removePollVote(householdId, threadId, pollId, req.body.voteId, req.user.id);
            res.status(204).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    static async getPollAnalytics(req, res, next) {
        try {
            const { householdId, messageId, pollId } = req.params;
            if (!householdId || !messageId || !pollId) {
                throw new Error("Missing required parameters: householdId, messageId, and pollId");
            }
            const response = await pollService.getPollAnalytics(householdId, messageId, pollId, req.user.id);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MessageController = MessageController;
