"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.createNotification = createNotification;
exports.markAsRead = markAsRead;
exports.deleteNotification = deleteNotification;
exports.getNotificationSettings = getNotificationSettings;
exports.updateNotificationSettings = updateNotificationSettings;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
const sockets_1 = require("../sockets");
const notificationTransformer_1 = require("../utils/transformers/notificationTransformer");
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
/**
 * Retrieves all notifications for a specific user.
 * @param userId - The ID of the user.
 * @returns A list of notifications.
 * @throws UnauthorizedError if the user is not authenticated.
 */
async function getNotifications(userId) {
    if (!userId) {
        throw new errorHandler_1.UnauthorizedError('Unauthorized');
    }
    const notifications = await database_1.default.notification.findMany({
        where: { userId },
        include: {
            user: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    const transformedNotifications = notifications.map((notification) => (0, notificationTransformer_1.transformNotification)(notification));
    return wrapResponse(transformedNotifications);
}
/**
 * Creates a new notification for a user.
 * @param data - The notification data.
 * @returns The created notification.
 * @throws NotFoundError if the user does not exist.
 */
async function createNotification(data) {
    if (!data.userId || !data.type || !data.message) {
        throw new Error('Invalid notification data');
    }
    const notification = await database_1.default.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('User not found.');
        }
        return tx.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                message: data.message,
                isRead: data.isRead ?? false,
            },
            include: {
                user: true,
            },
        });
    });
    const transformedNotification = (0, notificationTransformer_1.transformNotification)(notification);
    (0, sockets_1.getIO)().to(`user_${data.userId}`).emit('notification_update', {
        notification: transformedNotification,
    });
    return wrapResponse(transformedNotification);
}
/**
 * Marks a notification as read.
 * @param userId - The ID of the user.
 * @param notificationId - The ID of the notification.
 * @returns The updated notification.
 * @throws NotFoundError if the notification does not exist or does not belong to the user.
 */
async function markAsRead(userId, notificationId) {
    const updatedNotification = await database_1.default.$transaction(async (tx) => {
        const notification = await tx.notification.findUnique({
            where: { id: notificationId },
            include: {
                user: true,
            },
        });
        if (!notification || notification.userId !== userId) {
            throw new errorHandler_1.NotFoundError('Notification not found.');
        }
        return tx.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
            include: {
                user: true,
            },
        });
    });
    const transformedNotification = (0, notificationTransformer_1.transformNotification)(updatedNotification);
    (0, sockets_1.getIO)().to(`user_${userId}`).emit('notification_update', {
        notification: transformedNotification,
    });
    return wrapResponse(transformedNotification);
}
/**
 * Deletes a notification.
 * @param userId - The ID of the user.
 * @param notificationId - The ID of the notification.
 * @throws NotFoundError if the notification does not exist or does not belong to the user.
 */
async function deleteNotification(userId, notificationId) {
    await database_1.default.$transaction(async (tx) => {
        const notification = await tx.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification || notification.userId !== userId) {
            throw new errorHandler_1.NotFoundError('Notification not found.');
        }
        await tx.notification.delete({
            where: { id: notificationId },
        });
    });
    (0, sockets_1.getIO)().to(`user_${userId}`).emit('notification_update', { notificationId });
    return wrapResponse(undefined);
}
/**
 * Gets notification settings for a user or household.
 * @param userId - Optional user ID.
 * @param householdId - Optional household ID.
 * @returns The notification settings.
 * @throws NotFoundError if settings are not found.
 */
async function getNotificationSettings(userId, householdId) {
    const settings = await database_1.default.notificationSettings.findFirst({
        where: {
            OR: [{ userId: userId }, { householdId: householdId }],
        },
        include: {
            user: true,
            household: true,
        },
    });
    if (!settings) {
        throw new errorHandler_1.NotFoundError('Notification settings not found.');
    }
    const transformedSettings = (0, notificationTransformer_1.transformNotificationSettings)(settings);
    return wrapResponse(transformedSettings);
}
/**
 * Updates notification settings.
 * @param settingsId - The ID of the settings to update.
 * @param data - The updated settings data.
 * @returns The updated notification settings.
 * @throws NotFoundError if settings are not found.
 */
async function updateNotificationSettings(settingsId, data) {
    const settings = await database_1.default.notificationSettings.update({
        where: { id: settingsId },
        data,
        include: {
            user: true,
            household: true,
        },
    });
    const transformedSettings = (0, notificationTransformer_1.transformNotificationSettings)(settings);
    if (settings.userId) {
        (0, sockets_1.getIO)().to(`user_${settings.userId}`).emit('settings_update', {
            settings: transformedSettings,
        });
    }
    if (settings.householdId) {
        (0, sockets_1.getIO)().to(`household_${settings.householdId}`).emit('settings_update', {
            settings: transformedSettings,
        });
    }
    return wrapResponse(transformedSettings);
}
