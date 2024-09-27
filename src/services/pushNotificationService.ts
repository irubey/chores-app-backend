import admin from 'firebase-admin';
import prisma from '../config/database';

/**
 * Initialize Firebase Admin SDK only if all required environment variables are present.
 */
const requiredFirebaseEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];

const isPushNotificationsEnabled = process.env.ENABLE_PUSH_NOTIFICATIONS === 'true';
const isFirebaseConfigured = requiredFirebaseEnvVars.every((varName) => !!process.env[varName]);

if (isPushNotificationsEnabled && isFirebaseConfigured && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else if (!isPushNotificationsEnabled) {
  console.warn('Push notifications are disabled via configuration.');
} else if (!isFirebaseConfigured) {
  console.warn('Firebase environment variables are not fully set. Push notifications will be disabled.');
}

/**
 * Sends a push notification to a specific user.
 * @param to - The ID of the user to send the notification to.
 * @param title - The title of the notification.
 * @param body - The body content of the notification.
 * @param data - Optional additional data to send with the notification.
 */
export async function sendPushNotification(
  to: string,
  title: string,
  body: string,
  data?: { [key: string]: string }
): Promise<void> {
  if (!isPushNotificationsEnabled || !isFirebaseConfigured) {
    console.warn('Push notification service is not configured or disabled. Skipping notification.');
    return;
  }

  try {
    // Retrieve the user's device tokens from the database
    const user = await prisma.user.findUnique({
      where: { id: to },
      select: { deviceTokens: true },
    });

    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      console.warn(`No device tokens found for user with ID: ${to}`);
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      data,
      tokens: user.deviceTokens,
    };

    // Send the notification via Firebase Cloud Messaging
    const response = await admin.messaging().sendMulticast(message);

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(user.deviceTokens[idx]);
          console.error(
            `Failed to send notification to ${user.deviceTokens[idx]}: ${resp.error}`
          );
        }
      });
      // Optionally, remove invalid tokens from the user's device tokens
      if (failedTokens.length > 0) {
        const updatedTokens = user.deviceTokens.filter(token => !failedTokens.includes(token));
        await prisma.user.update({
          where: { id: to },
          data: {
            deviceTokens: updatedTokens,
          },
        });
        console.log(`Removed ${failedTokens.length} invalid device tokens for user ID: ${to}`);
      }
    }

    console.log(`Push notification sent to user ID: ${to}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Registers a new device token for a user.
 * @param userId - The ID of the user.
 * @param deviceToken - The device token to register.
 */
export async function registerDeviceToken(userId: string, deviceToken: string): Promise<void> {
  if (!isPushNotificationsEnabled || !isFirebaseConfigured) {
    console.warn('Push notification service is not configured or disabled. Skipping device token registration.');
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceTokens: true },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    // Avoid adding duplicate tokens
    if (!user.deviceTokens.includes(deviceToken)) {
      const updatedTokens = [...user.deviceTokens, deviceToken];
      await prisma.user.update({
        where: { id: userId },
        data: {
          deviceTokens: updatedTokens,
        },
      });
      console.log(`Device token registered for user ID: ${userId}`);
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
}

/**
 * Removes a device token from a user.
 * @param userId - The ID of the user.
 * @param deviceToken - The device token to remove.
 */
export async function removeDeviceToken(userId: string, deviceToken: string): Promise<void> {
  if (!isPushNotificationsEnabled || !isFirebaseConfigured) {
    console.warn('Push notification service is not configured or disabled. Skipping device token removal.');
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deviceTokens: true },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const updatedTokens = user.deviceTokens.filter(token => token !== deviceToken);

    await prisma.user.update({
      where: { id: userId },
      data: {
        deviceTokens: updatedTokens,
      },
    });
    console.log(`Device token removed for user ID: ${userId}`);
  } catch (error) {
    console.error('Error removing device token:', error);
  }
}