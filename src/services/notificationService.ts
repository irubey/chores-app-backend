import prisma from '../config/database';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import {
  CreateNotificationDTO,
  UpdateNotificationDTO,
  Notification,
  NotificationSettings,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { NotificationType } from '@shared/enums';
import { getIO } from '../sockets';
import {
  transformNotification,
  transformNotificationSettings,
} from '../utils/transformers/notificationTransformer';
import {
  PrismaNotificationBase,
  PrismaNotificationWithFullRelations,
  PrismaNotificationSettingsWithFullRelations,
} from '../utils/transformers/transformerPrismaTypes';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Retrieves all notifications for a specific user.
 * @param userId - The ID of the user.
 * @returns A list of notifications.
 * @throws UnauthorizedError if the user is not authenticated.
 */
export async function getNotifications(
  userId: string
): Promise<ApiResponse<Notification[]>> {
  if (!userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const transformedNotifications = notifications.map((notification) =>
    transformNotification(notification as PrismaNotificationWithFullRelations)
  );

  return wrapResponse(transformedNotifications);
}

/**
 * Creates a new notification for a user.
 * @param data - The notification data.
 * @returns The created notification.
 * @throws NotFoundError if the user does not exist.
 */
export async function createNotification(
  data: CreateNotificationDTO
): Promise<ApiResponse<Notification>> {
  if (!data.userId || !data.type || !data.message) {
    throw new Error('Invalid notification data');
  }

  const notification = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
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

  const transformedNotification = transformNotification(
    notification as PrismaNotificationWithFullRelations
  );

  getIO().to(`user_${data.userId}`).emit('notification_update', {
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
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<ApiResponse<Notification>> {
  const updatedNotification = await prisma.$transaction(async (tx) => {
    const notification = await tx.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: true,
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification not found.');
    }

    return tx.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        user: true,
      },
    });
  });

  const transformedNotification = transformNotification(
    updatedNotification as PrismaNotificationWithFullRelations
  );

  getIO().to(`user_${userId}`).emit('notification_update', {
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
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<ApiResponse<void>> {
  await prisma.$transaction(async (tx) => {
    const notification = await tx.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundError('Notification not found.');
    }

    await tx.notification.delete({
      where: { id: notificationId },
    });
  });

  getIO().to(`user_${userId}`).emit('notification_update', { notificationId });

  return wrapResponse(undefined);
}

/**
 * Gets notification settings for a user or household.
 * @param userId - Optional user ID.
 * @param householdId - Optional household ID.
 * @returns The notification settings.
 * @throws NotFoundError if settings are not found.
 */
export async function getNotificationSettings(
  userId?: string,
  householdId?: string
): Promise<ApiResponse<NotificationSettings>> {
  const settings = await prisma.notificationSettings.findFirst({
    where: {
      OR: [{ userId: userId }, { householdId: householdId }],
    },
    include: {
      user: true,
      household: true,
    },
  });

  if (!settings) {
    throw new NotFoundError('Notification settings not found.');
  }

  const transformedSettings = transformNotificationSettings(
    settings as PrismaNotificationSettingsWithFullRelations
  );
  return wrapResponse(transformedSettings);
}

/**
 * Updates notification settings.
 * @param settingsId - The ID of the settings to update.
 * @param data - The updated settings data.
 * @returns The updated notification settings.
 * @throws NotFoundError if settings are not found.
 */
export async function updateNotificationSettings(
  settingsId: string,
  data: Partial<NotificationSettings>
): Promise<ApiResponse<NotificationSettings>> {
  const settings = await prisma.notificationSettings.update({
    where: { id: settingsId },
    data,
    include: {
      user: true,
      household: true,
    },
  });

  const transformedSettings = transformNotificationSettings(
    settings as PrismaNotificationSettingsWithFullRelations
  );

  if (settings.userId) {
    getIO().to(`user_${settings.userId}`).emit('settings_update', {
      settings: transformedSettings,
    });
  }

  if (settings.householdId) {
    getIO().to(`household_${settings.householdId}`).emit('settings_update', {
      settings: transformedSettings,
    });
  }

  return wrapResponse(transformedSettings);
}
