import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  updateNotificationPreferences
} from '../controllers/notificationController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { updateNotificationPreferencesSchema } from '../utils/validators';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Get all notifications for the authenticated user
router.get('/', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getNotifications(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Mark a notification as read
router.put('/:notification_id/read', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    markNotificationAsRead(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Delete a notification
router.delete('/:notification_id', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    deleteNotification(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update notification preferences
router.put('/preferences', validateRequest(updateNotificationPreferencesSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    updateNotificationPreferences(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;