"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/notifications
 * @desc    Retrieve all notifications for the authenticated user
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(notificationController_1.NotificationController.getNotifications));
/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Protected, Admin only (Assuming only admins can create notifications)
 */
router.post("/", authMiddleware_1.authMiddleware, 
// rbacMiddleware(['ADMIN']), // Uncomment if only admins can create notifications
(0, validationMiddleware_1.validate)(validationSchemas_1.createNotificationSchema), (0, asyncHandler_1.asyncHandler)(notificationController_1.NotificationController.createNotification));
/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Protected
 */
router.patch("/:notificationId/read", authMiddleware_1.authMiddleware, (0, validationMiddleware_1.validate)(validationSchemas_1.markAsReadSchema), (0, asyncHandler_1.asyncHandler)(notificationController_1.NotificationController.markAsRead));
/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Protected
 */
router.delete("/:notificationId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(notificationController_1.NotificationController.deleteNotification));
/**
 * @route   GET /api/notifications/settings
 * @desc    Retrieve notification settings for the authenticated user or household
 * @access  Protected
 */
router.get("/settings", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(notificationController_1.NotificationController.getNotificationSettings));
/**
 * @route   PATCH /api/notifications/settings/:settingsId
 * @desc    Update notification settings
 * @access  Protected
 */
router.patch("/settings/:settingsId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(notificationController_1.NotificationController.updateNotificationSettings));
exports.default = router;
