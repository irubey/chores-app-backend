import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createNotificationSchema,
  markAsReadSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   GET /api/notifications
 * @desc    Retrieve all notifications for the authenticated user
 * @access  Protected
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(NotificationController.getNotifications)
);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Protected, Admin only (Assuming only admins can create notifications)
 */
router.post(
  '/',
  authMiddleware,
  // rbacMiddleware(['ADMIN']), // Uncomment if only admins can create notifications
  validate(createNotificationSchema),
  asyncHandler(NotificationController.createNotification)
);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Protected
 */
router.patch(
  '/:notificationId/read',
  authMiddleware,
  validate(markAsReadSchema),
  asyncHandler(NotificationController.markAsRead)
);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Protected
 */
router.delete(
  '/:notificationId',
  authMiddleware,
  asyncHandler(NotificationController.deleteNotification)
);

/**
 * @route   GET /api/notifications/settings
 * @desc    Retrieve notification settings for the authenticated user or household
 * @access  Protected
 */
router.get(
  '/settings',
  authMiddleware,
  asyncHandler(NotificationController.getNotificationSettings)
);

/**
 * @route   PATCH /api/notifications/settings/:settingsId
 * @desc    Update notification settings
 * @access  Protected
 */
router.patch(
  '/settings/:settingsId',
  authMiddleware,
  asyncHandler(NotificationController.updateNotificationSettings)
);

export default router;
