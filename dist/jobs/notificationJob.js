"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotifications = processNotifications;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const emailUtils_1 = require("../utils/emailUtils");
const pushNotificationService_1 = require("../services/pushNotificationService");
/**
 * Processes and sends pending notifications based on user notification settings.
 */
async function processNotifications() {
    try {
        const notifications = await database_1.default.notification.findMany({
            where: {
                isRead: false,
            },
            include: {
                user: {
                    include: {
                        notificationSettings: {
                            where: {
                                userId: {
                                    not: null,
                                },
                            },
                        },
                    },
                },
            },
        });
        for (const notification of notifications) {
            const userSettings = notification.user.notificationSettings[0];
            // Skip if user has no notification settings
            if (!userSettings) {
                console.warn(`No notification settings found for user ${notification.user.id}`);
                continue;
            }
            // Check if the notification type is enabled in user settings
            const shouldSendNotification = shouldSendBasedOnType(notification.type, userSettings);
            if (!shouldSendNotification) {
                console.log(`Notification type ${notification.type} is disabled for user ${notification.user.id}`);
                continue;
            }
            // Send email notification if user has an email
            if (notification.user.email) {
                await (0, emailUtils_1.sendEmail)({
                    to: notification.user.email,
                    subject: getNotificationSubject(notification.type),
                    text: notification.message,
                });
            }
            // Send push notification if user has device tokens
            if (notification.user.deviceTokens &&
                notification.user.deviceTokens.length > 0) {
                await (0, pushNotificationService_1.sendPushNotification)(notification.user.id, getNotificationSubject(notification.type), notification.message, { type: notification.type });
            }
            // Mark as read after sending
            await database_1.default.notification.update({
                where: { id: notification.id },
                data: { isRead: true },
            });
        }
        console.log(`Processed ${notifications.length} notifications.`);
    }
    catch (error) {
        console.error("Error processing notifications:", error);
    }
}
/**
 * Determines if a notification should be sent based on its type and user settings.
 */
function shouldSendBasedOnType(type, settings) {
    switch (type) {
        case client_1.NotificationType.NEW_MESSAGE:
            return settings.messageNotif;
        case client_1.NotificationType.CHORE_ASSIGNED:
            return settings.choreNotif;
        case client_1.NotificationType.EXPENSE_UPDATED:
        case client_1.NotificationType.PAYMENT_REMINDER:
            return settings.financeNotif;
        case client_1.NotificationType.EVENT_REMINDER:
            return settings.calendarNotif || settings.remindersNotif;
        default:
            return true; // Send other types by default
    }
}
/**
 * Gets a user-friendly subject line for the notification.
 */
function getNotificationSubject(type) {
    switch (type) {
        case client_1.NotificationType.NEW_MESSAGE:
            return "New Message in Your Household";
        case client_1.NotificationType.CHORE_ASSIGNED:
            return "New Chore Assignment";
        case client_1.NotificationType.EXPENSE_UPDATED:
            return "Expense Update";
        case client_1.NotificationType.PAYMENT_REMINDER:
            return "Payment Reminder";
        case client_1.NotificationType.EVENT_REMINDER:
            return "Event Reminder";
        default:
            return "New Notification";
    }
}
