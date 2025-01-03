import * as notificationService from '../services/notificationService';
/**
 * NotificationController handles all CRUD operations related to notifications.
 */
export class NotificationController {
    /**
     * Retrieves all notifications for the authenticated user.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async getNotifications(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const notifications = await notificationService.getNotifications(req.user.id);
            res.status(200).json(notifications);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new notification for a user.
     * @param req Express Request object containing notification data
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async createNotification(req, res, next) {
        try {
            const notificationData = req.body;
            const notification = await notificationService.createNotification(notificationData);
            res.status(201).json(notification);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Marks a specific notification as read.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async markAsRead(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { notificationId } = req.params;
            const updatedNotification = await notificationService.markAsRead(req.user.id, notificationId);
            res.status(200).json(updatedNotification);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a specific notification.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async deleteNotification(req, res, next) {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { notificationId } = req.params;
            await notificationService.deleteNotification(req.user.id, notificationId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
