import * as messageService from '../services/messageService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
/**
 * MessageController handles all CRUD operations related to messages.
 */
export class MessageController {
    /**
     * Retrieves all messages for a specific household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async getMessages(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const householdId = req.params.householdId;
            const messages = await messageService.getMessages(householdId, req.user.id);
            res.status(200).json(messages);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new message within a household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async createMessage(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const householdId = req.params.householdId;
            const messageData = req.body;
            const message = await messageService.createMessage(householdId, messageData, req.user.id);
            res.status(201).json(message);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific message.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async getMessageDetails(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, messageId } = req.params;
            const message = await messageService.getMessageById(householdId, messageId, req.user.id);
            if (!message) {
                throw new NotFoundError('Message not found');
            }
            res.status(200).json(message);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing message.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async updateMessage(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, messageId } = req.params;
            const updateData = req.body;
            const updatedMessage = await messageService.updateMessage(householdId, messageId, updateData, req.user.id);
            if (!updatedMessage) {
                throw new NotFoundError('Message not found or you do not have permission to update it');
            }
            res.status(200).json(updatedMessage);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a message from a household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async deleteMessage(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, messageId } = req.params;
            await messageService.deleteMessage(householdId, messageId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Adds a thread to a specific message.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async addThread(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, messageId } = req.params;
            const threadData = req.body;
            const thread = await messageService.addThread(householdId, messageId, threadData, req.user.id);
            res.status(201).json(thread);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Adds an attachment to a specific message.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async addAttachment(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, messageId } = req.params;
            const attachmentData = req.body;
            const attachment = await messageService.addAttachment(householdId, messageId, attachmentData, req.user.id);
            res.status(201).json(attachment);
        }
        catch (error) {
            next(error);
        }
    }
}
