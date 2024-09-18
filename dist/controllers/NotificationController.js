"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
const logger_1 = require("../utils/logger");
class NotificationController {
    constructor() {
        // Get all notifications for the authenticated user
        this.getNotifications = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id; // Assuming the user object is attached to the request by authMiddleware
                const notifications = yield this.notificationService.getNotifications(userId);
                res.status(200).json(notifications);
            }
            catch (error) {
                logger_1.logger.error('Error in getNotifications:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Mark a notification as read
        this.markAsRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const notificationId = req.params.id;
                yield this.notificationService.markAsRead(userId, notificationId);
                res.status(200).json({ message: 'Notification marked as read' });
            }
            catch (error) {
                logger_1.logger.error('Error in markAsRead:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Mark all notifications as read
        this.markAllAsRead = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                yield this.notificationService.markAllAsRead(userId);
                res.status(200).json({ message: 'All notifications marked as read' });
            }
            catch (error) {
                logger_1.logger.error('Error in markAllAsRead:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Delete a notification
        this.deleteNotification = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const notificationId = req.params.id;
                yield this.notificationService.deleteNotification(userId, notificationId);
                res.status(200).json({ message: 'Notification deleted' });
            }
            catch (error) {
                logger_1.logger.error('Error in deleteNotification:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Get notification preferences
        this.getNotificationPreferences = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const preferences = yield this.notificationService.getNotificationPreferences(userId);
                res.status(200).json(preferences);
            }
            catch (error) {
                logger_1.logger.error('Error in getNotificationPreferences:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Update notification preferences
        this.updateNotificationPreferences = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const preferences = req.body;
                yield this.notificationService.updateNotificationPreferences(userId, preferences);
                res.status(200).json({ message: 'Notification preferences updated' });
            }
            catch (error) {
                logger_1.logger.error('Error in updateNotificationPreferences:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        this.notificationService = new notificationService_1.NotificationService();
    }
}
exports.NotificationController = NotificationController;
exports.default = new NotificationController();
