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
exports.notificationService = exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const index_1 = require("../sockets/index");
const prisma = new client_1.PrismaClient();
class NotificationService {
    createNotification(userId, type, message, choreId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield prisma.notification.create({
                    data: {
                        userId,
                        type,
                        message,
                        choreId,
                    },
                });
                // Emit real-time notification
                this.emitNotification(userId, notification);
                return notification;
            }
            catch (error) {
                logger_1.logger.error('Error creating notification:', error);
                throw new Error('Failed to create notification');
            }
        });
    }
    getNotificationsForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma.notification.findMany({
                    where: { userId },
                    orderBy: { sentAt: 'desc' },
                });
            }
            catch (error) {
                logger_1.logger.error('Error fetching notifications for user:', error);
                throw new Error('Failed to fetch notifications');
            }
        });
    }
    markNotificationAsRead(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma.notification.update({
                    where: { id: notificationId },
                    data: { read: true },
                });
            }
            catch (error) {
                logger_1.logger.error('Error marking notification as read:', error);
                throw new Error('Failed to mark notification as read');
            }
        });
    }
    deleteNotification(notificationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.notification.delete({
                    where: { id: notificationId },
                });
            }
            catch (error) {
                logger_1.logger.error('Error deleting notification:', error);
                throw new Error('Failed to delete notification');
            }
        });
    }
    createChoreAssignedNotification(choreId, assignedUserIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chore = yield prisma.chore.findUnique({
                    where: { id: choreId },
                    include: { household: true },
                });
                if (!chore) {
                    throw new Error('Chore not found');
                }
                for (const userId of assignedUserIds) {
                    yield this.createNotification(userId, client_1.NotificationType.CHORE_ASSIGNED, `You've been assigned to "${chore.title}" in ${chore.household.name}`, choreId);
                }
            }
            catch (error) {
                logger_1.logger.error('Error creating chore assigned notification:', error);
                throw new Error('Failed to create chore assigned notification');
            }
        });
    }
    createChoreDueSoonNotification(choreId, assignedUserIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chore = yield prisma.chore.findUnique({
                    where: { id: choreId },
                    include: { household: true },
                });
                if (!chore) {
                    throw new Error('Chore not found');
                }
                for (const userId of assignedUserIds) {
                    yield this.createNotification(userId, client_1.NotificationType.CHORE_DUE_SOON, `"${chore.title}" in ${chore.household.name} is due soon`, choreId);
                }
            }
            catch (error) {
                logger_1.logger.error('Error creating chore due soon notification:', error);
                throw new Error('Failed to create chore due soon notification');
            }
        });
    }
    createChoreCompletedNotification(choreId, completedByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const chore = yield prisma.chore.findUnique({
                    where: { id: choreId },
                    include: { household: { include: { members: { include: { user: true } } } } },
                });
                if (!chore) {
                    throw new Error('Chore not found');
                }
                const completedByUser = (_a = chore.household.members.find(member => member.userId === completedByUserId)) === null || _a === void 0 ? void 0 : _a.user;
                if (!completedByUser) {
                    throw new Error('User not found in household');
                }
                for (const member of chore.household.members) {
                    if (member.userId !== completedByUserId) {
                        yield this.createNotification(member.userId, client_1.NotificationType.CHORE_COMPLETED, `${completedByUser.name} completed "${chore.title}" in ${chore.household.name}`, choreId);
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Error creating chore completed notification:', error);
                throw new Error('Failed to create chore completed notification');
            }
        });
    }
    emitNotification(userId, notification) {
        index_1.socketIo.to(userId).emit('notification', {
            type: notification.type,
            message: notification.message,
            data: notification,
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
