import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as notificationService from '../services/notificationService';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getNotifications(userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notification_id } = req.params;
    const userId = req.user.id;

    const result = await notificationService.markNotificationAsRead(notification_id, userId);

    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notification_id } = req.params;
    const userId = req.user.id;

    const result = await notificationService.deleteNotification(notification_id, userId);

    if (result.count === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotificationPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { notification_preferences } = req.body;

    const updatedPreferences = await notificationService.updateNotificationPreferences(userId, notification_preferences);

    res.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};