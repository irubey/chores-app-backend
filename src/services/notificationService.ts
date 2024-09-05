import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { sent_at: 'desc' },
  });
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      user_id: userId,
    },
    data: { read: true },
  });
};

export const deleteNotification = async (notificationId: string, userId: string) => {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      user_id: userId,
    },
  });
};

export const updateNotificationPreferences = async (userId: string, notificationPreferences: any) => {
  return prisma.userPreference.upsert({
    where: { user_id: userId },
    update: { notification_preferences: notificationPreferences },
    create: { user_id: userId, notification_preferences: notificationPreferences },
  });}
