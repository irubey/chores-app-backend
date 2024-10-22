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
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const messages = await messageService.getMessages(
        householdId,
        threadId,
        req.user!.id
      );
      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new message within a thread.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async createMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId } = req.params;
      const message = await messageService.createMessage(
        householdId,
        threadId,
        req.body,
        req.user!.id
      );
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific message.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getMessageDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const message = await messageService.getMessageById(
        householdId,
        threadId,
        messageId,
        req.user!.id
      );
      if (!message) {
        throw new NotFoundError("Message not found");
      }
      res.status(200).json(message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing message.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const updatedMessage = await messageService.updateMessage(
        householdId,
        threadId,
        messageId,
        req.body,
        req.user!.id
      );
      if (!updatedMessage) {
        throw new NotFoundError(
          "Message not found or you do not have permission to update it"
        );
      }
      res.status(200).json(updatedMessage);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a message from a thread.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      await messageService.deleteMessage(
        householdId,
        threadId,
        messageId,
        req.user!.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds an attachment to a specific message.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async addAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId } = req.params;
      const attachment = await messageService.addAttachment(
        householdId,
        threadId,
        messageId,
        req.body,
        req.user!.id
      );
      res.status(201).json(attachment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific attachment.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getAttachmentDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId, attachmentId } = req.params;
      const attachment = await messageService.getAttachmentById(
        householdId,
        threadId,
        messageId,
        attachmentId,
        req.user!.id
      );
      if (!attachment) {
        throw new NotFoundError("Attachment not found");
      }
      res.status(200).json(attachment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an attachment from a message.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, threadId, messageId, attachmentId } = req.params;
      await messageService.deleteAttachment(
        householdId,
        threadId,
        messageId,
        attachmentId,
        req.user!.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
