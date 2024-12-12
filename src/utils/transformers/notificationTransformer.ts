import {
  Notification,
  NotificationSettings,
  NotificationWithUser,
  NotificationSettingsWithUserAndHousehold,
  CreateNotificationDTO,
} from '@shared/types';
import { NotificationType } from '@shared/enums';
import {
  PrismaNotificationBase,
  PrismaNotificationWithFullRelations,
  PrismaNotificationSettingsWithFullRelations,
  PrismaUserMinimal,
  PrismaHouseholdBase,
} from './transformerPrismaTypes';
import { transformUser } from './userTransformer';
import { transformHousehold } from './householdTransformer';

function isValidNotificationType(type: string): type is NotificationType {
  return Object.values(NotificationType).includes(type as NotificationType);
}

export function transformNotification(
  notification: PrismaNotificationBase
): Notification {
  if (!notification) {
    throw new Error('Invalid notification data');
  }

  return {
    id: notification.id,
    userId: notification.userId,
    type: isValidNotificationType(notification.type)
      ? notification.type
      : NotificationType.OTHER,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

export function transformNotificationWithUser(
  notification: PrismaNotificationWithFullRelations
): NotificationWithUser {
  return {
    ...transformNotification(notification),
    user: transformUser(notification.user),
  };
}

export function transformNotificationSettings(
  settings: PrismaNotificationSettingsWithFullRelations
): NotificationSettingsWithUserAndHousehold {
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
    user: transformUser(settings.user),
    household: transformHousehold(settings.household),
  };
}

export function transformCreateNotificationDTO(
  dto: CreateNotificationDTO
): Omit<PrismaNotificationBase, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId: dto.userId,
    type: isValidNotificationType(dto.type) ? dto.type : NotificationType.OTHER,
    message: dto.message,
    isRead: dto.isRead ?? false,
  };
}
