"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformNotification = transformNotification;
exports.transformNotificationWithUser = transformNotificationWithUser;
exports.transformNotificationSettings = transformNotificationSettings;
exports.transformCreateNotificationDTO = transformCreateNotificationDTO;
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const userTransformer_1 = require("./userTransformer");
const householdTransformer_1 = require("./householdTransformer");
function isValidNotificationType(type) {
    return Object.values(enums_1.NotificationType).includes(type);
}
function transformNotification(notification) {
    if (!notification) {
        throw new Error('Invalid notification data');
    }
    return {
        id: notification.id,
        userId: notification.userId,
        type: isValidNotificationType(notification.type)
            ? notification.type
            : enums_1.NotificationType.OTHER,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
    };
}
function transformNotificationWithUser(notification) {
    return {
        ...transformNotification(notification),
        user: (0, userTransformer_1.transformUser)(notification.user),
    };
}
function transformNotificationSettings(settings) {
    if (!settings.user || !settings.household) {
        throw new Error('Notification settings must have both user and household');
    }
    return {
        id: settings.id,
        userId: settings.userId ?? undefined,
        householdId: settings.householdId ?? undefined,
        messageNotif: settings.messageNotif,
        mentionsNotif: settings.mentionsNotif,
        reactionsNotif: settings.reactionsNotif,
        choreNotif: settings.choreNotif,
        financeNotif: settings.financeNotif,
        calendarNotif: settings.calendarNotif,
        remindersNotif: settings.remindersNotif,
        user: (0, userTransformer_1.transformUser)(settings.user),
        household: (0, householdTransformer_1.transformHousehold)(settings.household),
    };
}
function transformCreateNotificationDTO(dto) {
    return {
        userId: dto.userId,
        type: isValidNotificationType(dto.type) ? dto.type : enums_1.NotificationType.OTHER,
        message: dto.message,
        isRead: dto.isRead ?? false,
    };
}
