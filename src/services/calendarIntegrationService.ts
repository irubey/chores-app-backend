import axios from 'axios';
import prisma from '../config/database';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';

/**
 * Syncs the household calendar with a user's personal calendar (e.g., Google Calendar).
 * This function assumes OAuth tokens are stored and managed appropriately.
 */
export async function syncWithPersonalCalendar(
  householdId: string,
  userId: string,
  accessToken: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
    include: {
      user: true,
    },
  });

  if (!membership) {
    throw new UnauthorizedError('You do not have access to this household.');
  }

  // Fetch household events
  const events = await prisma.event.findMany({
    where: { householdId },
  });

  // Prepare events for synchronization
  const calendarEvents = events.map((event) => ({
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'UTC', // Adjust as necessary
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: 'UTC', // Adjust as necessary
    },
    // Additional fields as needed
  }));

  try {
    // Example with Google Calendar API
    const response = await axios.post(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        items: calendarEvents,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Handle response as needed
    return response.data;
  } catch (error) {
    console.error('Error syncing with personal calendar:', error);
    throw new Error('Failed to sync with personal calendar.');
  }
}
