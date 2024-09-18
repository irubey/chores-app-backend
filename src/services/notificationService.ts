import prisma from '../config/database';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest, CreateNotificationDTO, UpdateNotificationDTO, PrismaNotification } from '../types';
import { getIO } from '../sockets';

/**
 * Retrieves all notifications for a specific user.
 * @param userId - The ID of the user.
 * @returns A list of notifications.
 * @throws UnauthorizedError if the user is not authenticated.
 */
export async function getNotifications(userId: string): Promise<PrismaNotification[]> {
  if (!userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return notifications;
}

/**
 * Creates a new notification for a user.
 * @param data - The notification data.
 * @returns The created notification.
 * @throws NotFoundError if the user does not exist.
 */
export async function createNotification(data: CreateNotificationDTO): Promise<PrismaNotification> {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      message: data.message,
      isRead: data.isRead ?? false,
    },
  });

  // Emit real-time event for new notification
  getIO().to(`user_${data.userId}`).emit('notification_update', { notification });

  return notification;
}

/**
 * Marks a notification as read.
 * @param userId - The ID of the user.
 * @param notificationId - The ID of the notification.
 * @returns The updated notification.
 * @throws NotFoundError if the notification does not exist or does not belong to the user.
 */
export async function markAsRead(userId: string, notificationId: string): Promise<PrismaNotification> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('Notification not found.');
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  // Emit real-time event for updated notification
  getIO().to(`user_${userId}`).emit('notification_update', { notification: updatedNotification });

  return updatedNotification;
}

/**
 * Deletes a notification.
 * @param userId - The ID of the user.
 * @param notificationId - The ID of the notification.
 * @throws NotFoundError if the notification does not exist or does not belong to the user.
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new NotFoundError('Notification not found.');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  // Emit real-time event for deleted notification
  getIO().to(`user_${userId}`).emit('notification_update', { notificationId });
}