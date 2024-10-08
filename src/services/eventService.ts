import { Event, HouseholdRole, Chore } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { CreateEventDTO, UpdateEventDTO, UpdateEventStatusDTO } from '../types/index';
import { getIO } from '../sockets';

/**
 * Retrieves all events for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of events.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getEvents(householdId: string, userId: string): Promise<Event[]> {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new UnauthorizedError('You do not have access to this household.');
  }

  const events = await prisma.event.findMany({
    where: { householdId },
    include: {
      chore: true,
      createdBy: true,
    },
  });

  return events;
}

/**
 * Creates a new event within a household.
 * @param householdId - The ID of the household.
 * @param data - The event data.
 * @param userId - The ID of the user creating the event.
 * @returns The created event.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 */
export async function createEvent(
  householdId: string,
  data: CreateEventDTO,
  userId: string
): Promise<Event> {
  // Verify user has ADMIN role in the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to create an event.');
  }

  const event = await prisma.event.create({
    data: {
      householdId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      createdById: userId,
      choreId: data.choreId || null,
      recurrence: data.recurrence,
      customRecurrence: data.customRecurrence,
      category: data.category,
      isAllDay: data.isAllDay,
      location: data.location,
      isPrivate: data.isPrivate,
      status: 'SCHEDULED',
    },
    include: {
      chore: true,
      createdBy: true,
      reminders: true,
    },
  });

  // Emit real-time event for new event
  getIO().to(`household_${householdId}`).emit('event_update', { event });

  return event;
}

/**
 * Retrieves details of a specific event.
 * @param householdId - The ID of the household.
 * @param eventId - The ID of the event.
 * @param userId - The ID of the requesting user.
 * @returns The event details.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the event does not exist.
 */
export async function getEventById(
  householdId: string,
  eventId: string,
  userId: string
): Promise<Event> {
  // Verify user is a member of the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new UnauthorizedError('You do not have access to this household.');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      chore: true,
      createdBy: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found.');
  }

  return event;
}

/**
 * Updates an existing event.
 * @param householdId - The ID of the household.
 * @param eventId - The ID of the event to update.
 * @param data - The updated event data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated event.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the event does not exist.
 */
export async function updateEvent(
  householdId: string,
  eventId: string,
  data: UpdateEventDTO,
  userId: string
): Promise<Event> {
  // Verify user has ADMIN role in the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to update this event.');
  }

  // If choreId is provided, verify the chore exists and belongs to the household
  if (data.choreId) {
    const chore = await prisma.chore.findUnique({
      where: { id: data.choreId },
    });
    if (!chore || chore.householdId !== householdId) {
      throw new NotFoundError('Associated chore not found in this household.');
    }
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      choreId: data.choreId !== undefined ? data.choreId : undefined,
      recurrence: data.recurrence,
      customRecurrence: data.customRecurrence,
      category: data.category,
      isAllDay: data.isAllDay,
      location: data.location,
      isPrivate: data.isPrivate,
    },
    include: {
      chore: true,
      createdBy: true,
      reminders: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found or you do not have permission to update it.');
  }

  // Emit real-time event for updated event
  getIO().to(`household_${householdId}`).emit('event_update', { event });

  return event;
}

/**
 * Deletes an event from a household.
 * @param householdId - The ID of the household.
 * @param eventId - The ID of the event to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the event does not exist.
 */
export async function deleteEvent(
  householdId: string,
  eventId: string,
  userId: string
): Promise<void> {
  // Verify user has ADMIN role in the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to delete this event.');
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundError('Event not found.');
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  // Emit real-time event for deleted event
  getIO().to(`household_${householdId}`).emit('event_update', { eventId });
}

/**
 * Updates the status of an event.
 * @param householdId - The ID of the household.
 * @param eventId - The ID of the event to update.
 * @param data - The updated event status data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated event.
 * @throws UnauthorizedError if the user does not have WRITE role.
 * @throws NotFoundError if the event does not exist.
 */
export async function updateEventStatus(
  householdId: string,
  eventId: string,
  data: UpdateEventStatusDTO,
  userId: string
): Promise<Event> {
  // Verify user has WRITE role in the household
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role === HouseholdRole.MEMBER) {
    throw new UnauthorizedError('You do not have permission to update this event status.');
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: data.status,
    },
    include: {
      chore: true,
      createdBy: true,
      reminders: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Event not found or you do not have permission to update it.');
  }

  // Emit real-time event for updated event status
  getIO().to(`household_${householdId}`).emit('event_update', { event });

  return event;
}