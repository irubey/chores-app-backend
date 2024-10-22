import prisma from "../config/database";
import {
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  EventCategory,
  CreateReminderDTO,
} from "../types";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { getIO } from "../sockets";

/**
 * Retrieves all general calendar events for a household.
 */
export async function getCalendarEvents(householdId: string, userId: string) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Retrieve general calendar events
  const events = await prisma.event.findMany({
    where: {
      householdId,
      category: {
        not: EventCategory.CHORE,
      },
    },
    include: {
      reminders: true,
      createdBy: true,
    },
  });

  return events;
}

/**
 * Creates a new general calendar event.
 */
export async function createCalendarEvent(
  householdId: string,
  data: CreateCalendarEventDTO,
  userId: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Create general calendar event
  const event = await prisma.event.create({
    data: {
      householdId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence,
      category: data.category || EventCategory.OTHER,
      createdById: userId,
      isAllDay: data.isAllDay,
      location: data.location,
      isPrivate: data.isPrivate || false,
      reminders: data.reminders
        ? {
            create: data.reminders.map((reminder: CreateReminderDTO) => ({
              time: reminder.time,
              type: reminder.type,
            })),
          }
        : undefined,
    },
    include: {
      reminders: true,
      createdBy: true,
    },
  });

  // Emit real-time event for new calendar event
  getIO()
    .to(`household_${householdId}`)
    .emit("calendar_event_created", { event });

  return event;
}

/**
 * Retrieves details of a specific general calendar event.
 */
export async function getEventById(
  householdId: string,
  eventId: string,
  userId: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Retrieve event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      reminders: true,
      createdBy: true,
    },
  });

  if (!event || event.householdId !== householdId) {
    throw new NotFoundError("Calendar event not found.");
  }

  return event;
}

/**
 * Updates an existing general calendar event.
 */
export async function updateEvent(
  householdId: string,
  eventId: string,
  data: UpdateCalendarEventDTO,
  userId: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Verify event exists and belongs to the household
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent || existingEvent.householdId !== householdId) {
    throw new NotFoundError("Calendar event not found.");
  }

  // Update event
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence,
      category: data.category || EventCategory.OTHER,
      isAllDay: data.isAllDay,
      location: data.location,
      isPrivate: data.isPrivate,
      reminders: data.reminders
        ? {
            deleteMany: {}, // Remove existing reminders
            create: data.reminders.map((reminder: CreateReminderDTO) => ({
              time: reminder.time,
              type: reminder.type,
            })),
          }
        : undefined,
    },
    include: {
      reminders: true,
      createdBy: true,
    },
  });

  // Emit real-time event for updated calendar event
  getIO()
    .to(`household_${householdId}`)
    .emit("calendar_event_updated", { event: updatedEvent });

  return updatedEvent;
}

/**
 * Deletes a general calendar event.
 */
export async function deleteEvent(
  householdId: string,
  eventId: string,
  userId: string
): Promise<void> {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Verify event exists and belongs to the household
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent || existingEvent.householdId !== householdId) {
    throw new NotFoundError("Calendar event not found.");
  }

  // Delete event
  await prisma.event.delete({
    where: { id: eventId },
  });

  // Emit real-time event for deleted calendar event
  getIO()
    .to(`household_${householdId}`)
    .emit("calendar_event_deleted", { eventId });
}

/**
 * Adds a reminder to a calendar event.
 */
export async function addReminder(
  householdId: string,
  eventId: string,
  reminderData: CreateReminderDTO,
  userId: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Verify event exists and belongs to the household
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.householdId !== householdId) {
    throw new NotFoundError("Calendar event not found.");
  }

  // Add reminder
  const reminder = await prisma.reminder.create({
    data: {
      eventId: eventId,
      time: reminderData.time,
      type: reminderData.type,
    },
  });

  return reminder;
}

/**
 * Removes a reminder from a calendar event.
 */
export async function removeReminder(
  householdId: string,
  eventId: string,
  reminderId: string,
  userId: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Verify reminder exists and belongs to the event
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, eventId },
  });

  if (!reminder) {
    throw new NotFoundError("Reminder not found.");
  }

  // Remove reminder
  await prisma.reminder.delete({
    where: { id: reminderId },
  });
}

/**
 * Retrieves events for a specific date.
 */
export async function getEventsByDate(
  householdId: string,
  date: Date,
  userId: string
) {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new UnauthorizedError("You do not have access to this household.");
  }

  // Normalize the date to UTC midnight
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Retrieve events for the specified date
  const events = await prisma.event.findMany({
    where: {
      householdId,
      startTime: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      reminders: true,
      createdBy: true,
    },
  });

  return events;
}
