"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService = __importStar(require("../services/notificationService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * NotificationController handles all CRUD operations related to notifications.
 */
class NotificationController {
    /**
     * Retrieves all notifications for the authenticated user.
     */
    static async getNotifications(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const response = await notificationService.getNotifications(req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new notification for a user.
     */
    static async createNotification(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const notificationData = {
                ...req.body,
                userId: req.user.id,
            };
            const response = await notificationService.createNotification(notificationData);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Marks a specific notification as read.
     */
    static async markAsRead(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { notificationId } = req.params;
            if (!notificationId) {
                throw new errorHandler_1.BadRequestError("Notification ID is required");
            }
            const response = await notificationService.markAsRead(req.user.id, notificationId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a specific notification.
     */
    static async deleteNotification(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { notificationId } = req.params;
            if (!notificationId) {
                throw new errorHandler_1.BadRequestError("Notification ID is required");
            }
            await notificationService.deleteNotification(req.user.id, notificationId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves notification settings for the authenticated user or household.
     */
    static async getNotificationSettings(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { householdId } = req.params;
            if (!householdId) {
                throw new errorHandler_1.BadRequestError("Household ID is required");
            }
            const response = await notificationService.getNotificationSettings(req.user.id, householdId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates notification settings.
     */
    static async updateNotificationSettings(req, res, next) {
        try {
            if (!req.user?.id) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { settingsId } = req.params;
            if (!settingsId) {
                throw new errorHandler_1.BadRequestError("Settings ID is required");
            }
            const settingsData = req.body;
            const response = await notificationService.updateNotificationSettings(settingsId, settingsData);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationController = NotificationController;
