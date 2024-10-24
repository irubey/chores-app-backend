import { Response, NextFunction } from "express";
import * as messageService from "../services/messageService";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { AuthenticatedRequest } from "../types";

/**
 * MessageController handles all CRUD operations related to messages.
 */
export class MessageController {
  /**
   * Retrieves all messages for a specific thread.
   */
  static async getMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const response = await messageService.getMessages(
        householdId,
        threadId,
        req.user!.id
      );
      res.status(response.status || 200).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new message within a thread.
   */
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
      res.status(response.status || 201).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific message.
   */
  static async getMessageDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const response = await messageService.getMessageById(
        householdId,
        threadId,
        messageId,
        req.user!.id
      );
      if (!response.data) {
        throw new NotFoundError("Message not found");
      }
      res.status(response.status || 200).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing message.
   */
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
      if (!response.data) {
        throw new NotFoundError(
          "Message not found or you do not have permission to update it"
        );
      }
      res.status(response.status || 200).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a message from a thread.
   */
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
      res.status(response.status || 204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds an attachment to a specific message.
   */
  static async addAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const response = await messageService.addAttachment(
        householdId,
        threadId,
        messageId,
        req.body,
        req.user!.id
      );
      res.status(response.status || 201).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific attachment.
   */
  static async getAttachmentDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId, attachmentId } = req.params;
      const response = await messageService.getAttachmentById(
        householdId,
        threadId,
        messageId,
        attachmentId,
        req.user!.id
      );
      if (!response.data) {
        throw new NotFoundError("Attachment not found");
      }
      res.status(response.status || 200).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an attachment from a message.
   */
  static async deleteAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId, attachmentId } = req.params;
      const response = await messageService.deleteAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId,
        req.user!.id
      );
      res.status(response.status || 204).send();
    } catch (error) {
      next(error);
    }
  }
}
