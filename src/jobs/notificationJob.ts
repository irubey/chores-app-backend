import prisma from '../config/database';
import { NotificationType } from '../types';
import { sendEmail } from '../utils/emailUtils';
import { sendPushNotification } from '../services/pushNotificationService';

/**
 * Processes and sends pending notifications.
 */
export async function processNotifications() {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        isRead: false,
      },
      include: {
        user: true,
      },
    });

    for (const notification of notifications) {
      // Send email notification
      await sendEmail({
        to: notification.user.email,
        subject: `New ${notification.type} Notification`,
        text: notification.message,
      });

      // Send push notification
      await sendPushNotification(
        notification.user.id,
        `New ${notification.type} Notification`, // Providing a title
        notification.message,
        { /* optional data */ }
      );

      // Mark as read after sending
      await prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true },
      });
    }

    console.log(`Processed ${notifications.length} notifications.`);
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
}