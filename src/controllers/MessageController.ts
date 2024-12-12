import { Response, NextFunction } from 'express';
import * as messageService from '../services/messages/messageService';
import * as attachmentService from '../services/messages/attachmentService';
import * as mentionService from '../services/messages/mentionService';
import * as reactionService from '../services/messages/reactionService';
import * as pollService from '../services/messages/pollService';
import { AuthenticatedRequest } from '../types';
import { PaginationOptions } from '@shared/interfaces/pagination';
import { ReactionType } from '@shared/enums';

/**
 * MessageController handles all service operations related to messages.
 */
export class MessageController {
  /**
   * Message related endpoints
   */
  static async getMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const { cursor, limit } = req.query;

      const paginationOptions: PaginationOptions = {
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const response = await messageService.getMessages(
        householdId,
        threadId,
        req.user!.id,
        paginationOptions
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const response = await messageService.createMessage(
        householdId,
        threadId,
        req.body,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const response = await messageService.updateMessage(
        householdId,
        threadId,
        messageId,
        req.body,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const response = await messageService.deleteMessage(
        householdId,
        threadId,
        messageId,
        req.user!.id
      );
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async markMessageAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await messageService.markMessageAsRead(
        householdId,
        messageId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getMessageReadStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await messageService.getMessageReadStatus(
        householdId,
        messageId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attachment related endpoints
   */
  static async addAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const response = await attachmentService.addAttachment(
        householdId,
        threadId,
        messageId,
        req.body,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId, attachmentId } = req.params;
      const response = await attachmentService.deleteAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId,
        req.user!.id
      );
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId, attachmentId } = req.params;
      const response = await attachmentService.getAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getMessageAttachments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const response = await attachmentService.getMessageAttachments(
        householdId,
        threadId,
        messageId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mention related endpoints
   */
  static async createMention(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await mentionService.createMention(
        householdId,
        messageId,
        req.body,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getUserMentions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const response = await mentionService.getUserMentions(
        householdId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getMessageMentions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await mentionService.getMessageMentions(
        householdId,
        messageId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMention(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId, mentionId } = req.params;
      const response = await mentionService.deleteMention(
        householdId,
        messageId,
        mentionId,
        req.user!.id
      );
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadMentionsCount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const response = await mentionService.getUnreadMentionsCount(
        householdId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reaction related endpoints
   */
  static async addReaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await reactionService.addReaction(
        householdId,
        messageId,
        req.user!.id,
        req.body
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async removeReaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId, reactionId } = req.params;
      const response = await reactionService.removeReaction(
        householdId,
        messageId,
        reactionId,
        req.user!.id
      );
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getMessageReactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await reactionService.getMessageReactions(
        householdId,
        messageId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getReactionAnalytics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await reactionService.getReactionAnalytics(
        householdId,
        messageId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getReactionsByType(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, messageId } = req.params;
      const response = await reactionService.getReactionsByType(
        householdId,
        messageId,
        req.body.type as ReactionType,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Poll related endpoints
   */
  static async getPollsInThread(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const response = await pollService.getPollsInThread(
        householdId,
        threadId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getPoll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, pollId } = req.params;
      const response = await pollService.getPoll(
        householdId,
        threadId,
        pollId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createPoll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const response = await pollService.createPoll(
        householdId,
        threadId,
        req.body,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updatePoll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, pollId } = req.params;
      const response = await pollService.updatePoll(
        householdId,
        threadId,
        pollId,
        req.body,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deletePoll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, pollId } = req.params;
      const response = await pollService.deletePoll(
        householdId,
        threadId,
        pollId,
        req.user!.id
      );
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async votePoll(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, pollId } = req.params;
      const response = await pollService.votePoll(
        householdId,
        threadId,
        pollId,
        req.body,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async removePollVote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, pollId } = req.params;
      const response = await pollService.removePollVote(
        householdId,
        threadId,
        pollId,
        req.body.voteId,
        req.user!.id
      );
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getPollAnalytics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, pollId } = req.params;
      const response = await pollService.getPollAnalytics(
        householdId,
        threadId,
        pollId,
        req.user!.id
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
