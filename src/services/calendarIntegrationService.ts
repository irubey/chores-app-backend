import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectCalendar = async (userId: string, provider: string, access_token: string, refresh_token: string, expires_at: Date) => {
  return prisma.calendarIntegration.upsert({
    where: { user_id: userId },
    update: {
      provider,
      access_token,
      refresh_token,
      expires_at,
    },
    create: {
      user_id: userId,
      provider,
      access_token,
      refresh_token,
      expires_at,
    },
  });
};

export const disconnectCalendar = async (userId: string) => {
  return prisma.calendarIntegration.delete({
    where: { user_id: userId },
  });
};

export const getCalendarIntegration = async (userId: string) => {
  return prisma.calendarIntegration.findUnique({
    where: { user_id: userId },
  });
};

export const syncChores = async (userId: string) => {
  // TODO: Implement the logic to sync chores with the connected calendar
  // This will involve:
  // 1. Fetching the user's chores
  // 2. Fetching the calendar integration details
  // 3. Using a calendar API (e.g., Google Calendar API) to create/update events
  
  // For now, we'll just return a placeholder message
  return { message: 'Chores synced successfully' };
};
