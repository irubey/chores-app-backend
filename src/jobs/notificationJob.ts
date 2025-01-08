import prisma from "../config/database";
import { NotificationType } from "@prisma/client";
import { sendEmail } from "../utils/emailUtils";
import { sendPushNotification } from "../services/pushNotificationService";
import { NotificationWithUser } from "@shared/types";

/**
 * Processes and sends pending notifications based on user notification settings.
 */
export async function processNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        isRead: false,
      },
      include: {
        user: {
          include: {
            notificationSettings: {
              where: {
                userId: {
                  not: null,
                },
              },
            },
          },
        },
      },
    });

    for (const notification of notifications) {
      const userSettings = notification.user.notificationSettings[0];

      // Skip if user has no notification settings
      if (!userSettings) {
        console.warn(
          `No notification settings found for user ${notification.user.id}`
        );
        continue;
      }

      // Check if the notification type is enabled in user settings
      const shouldSendNotification = shouldSendBasedOnType(
        notification.type,
        userSettings
      );

      if (!shouldSendNotification) {
        console.log(
          `Notification type ${notification.type} is disabled for user ${notification.user.id}`
        );
        continue;
      }

      // Send email notification if user has an email
      if (notification.user.email) {
        await sendEmail({
          to: notification.user.email,
          subject: getNotificationSubject(notification.type),
          text: notification.message,
        });
      }

      // Send push notification if user has device tokens
      if (
        notification.user.deviceTokens &&
        notification.user.deviceTokens.length > 0
      ) {
        await sendPushNotification(
          notification.user.id,
          getNotificationSubject(notification.type),
          notification.message,
          { type: notification.type }
        );
      }

      // Mark as read after sending
      await prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true },
      });
    }

    console.log(`Processed ${notifications.length} notifications.`);
  } catch (error) {
    console.error("Error processing notifications:", error);
  }
}

/**
 * Determines if a notification should be sent based on its type and user settings.
 */
function shouldSendBasedOnType(type: NotificationType, settings: any): boolean {
  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return settings.messageNotif;
    case NotificationType.CHORE_ASSIGNED:
      return settings.choreNotif;
    case NotificationType.EXPENSE_UPDATED:
    case NotificationType.PAYMENT_REMINDER:
      return settings.financeNotif;
    case NotificationType.EVENT_REMINDER:
      return settings.calendarNotif || settings.remindersNotif;
    default:
      return true; // Send other types by default
  }
}

/**
 * Gets a user-friendly subject line for the notification.
 */
function getNotificationSubject(type: NotificationType): string {
  switch (type) {
    case NotificationType.NEW_MESSAGE:
      return "New Message in Your Household";
    case NotificationType.CHORE_ASSIGNED:
      return "New Chore Assignment";
    case NotificationType.EXPENSE_UPDATED:
      return "Expense Update";
    case NotificationType.PAYMENT_REMINDER:
      return "Payment Reminder";
    case NotificationType.EVENT_REMINDER:
      return "Event Reminder";
    default:
      return "New Notification";
  }
}
