import prisma from "../config/database";
import {
  CreateChoreEventDTO,
  UpdateChoreEventDTO,
  EventCategory,
  EventStatus,
  EventRecurrence,
} from "../types";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { getIO } from "../sockets";

/**
 * Retrieves all events linked to a specific chore.
 */
export async function getChoreEvents(
  householdId: string,
  choreId: string,
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

  // Retrieve chore events
  const events = await prisma.event.findMany({
    where: {
      choreId: choreId,
      householdId: householdId,
      category: EventCategory.CHORE,
    },
    include: {
      reminders: true,
      chore: true,
    },
  });

  return events;
}

/**
 * Creates a new event associated with a chore.
 */
export async function createChoreEvent(
  householdId: string,
  choreId: string,
  data: CreateChoreEventDTO,
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

  // Verify chore exists
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  });

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  // Create event linked to the chore
  const event = await prisma.event.create({
    data: {
      householdId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence as EventRecurrence | undefined,
      category: EventCategory.CHORE,
      choreId: choreId,
      createdById: userId,
      // Additional fields as necessary
    },
    include: {
      reminders: true,
      chore: true,
    },
  });

  // Emit real-time event for new chore event
  getIO().to(`household_${householdId}`).emit("chore_event_created", { event });

  return event;
}

/**
 * Retrieves details of a specific chore event.
 */
export async function getChoreEventById(
  householdId: string,
  choreId: string,
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

  // Retrieve chore event
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
    include: {
      reminders: true,
      chore: true,
    },
  });

  if (!event) {
    throw new NotFoundError("Chore event not found.");
  }

  return event;
}

/**
 * Updates an existing chore-linked event.
 */
export async function updateChoreEvent(
  householdId: string,
  choreId: string,
  eventId: string,
  data: UpdateChoreEventDTO,
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

  // Verify chore exists
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  });

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  // Update chore event
  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
    data: {
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence as EventRecurrence | undefined,
    },
    include: {
      reminders: true,
      chore: true,
    },
  });

  // Emit real-time event for updated chore event
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_event_updated", { event: updatedEvent });

  return updatedEvent;
}

/**
 * Deletes a chore-linked event.
 */
export async function deleteChoreEvent(
  householdId: string,
  choreId: string,
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

  // Delete chore event
  await prisma.event.delete({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
  });

  // Emit real-time event for deleted chore event
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_event_deleted", { eventId });
}

/**
 * Updates the status of a chore event.
 */
export async function updateChoreEventStatus(
  householdId: string,
  choreId: string,
  eventId: string,
  userId: string,
  status: EventStatus
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

  // Update event status
  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
    data: {
      status: status,
    },
    include: {
      reminders: true,
      chore: true,
    },
  });

  // Emit real-time event for updated chore event status
  getIO().to(`household_${householdId}`).emit("chore_event_status_updated", {
    event: updatedEvent,
  });

  return updatedEvent;
}

/**
 * Reschedules a chore event.
 */
export async function rescheduleChoreEvent(
  householdId: string,
  choreId: string,
  eventId: string,
  userId: string,
  newStartTime: Date,
  newEndTime: Date
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

  // Update event
  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
    data: {
      startTime: newStartTime,
      endTime: newEndTime,
    },
    include: {
      reminders: true,
      chore: true,
    },
  });

  // Emit real-time event for updated chore event
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_event_updated", { event: updatedEvent });

  return updatedEvent;
}

/**
 * Retrieves upcoming chore events.
 */
export async function getUpcomingChoreEvents(
  householdId: string,
  choreId: string,
  userId: string,
  limit?: number
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

  // Retrieve upcoming chore events
  const events = await prisma.event.findMany({
    where: {
      choreId: choreId,
      householdId: householdId,
      category: EventCategory.CHORE,
      status: EventStatus.SCHEDULED,
    },
    orderBy: {
      startTime: "asc",
    },
    take: limit,
  });

  return events;
}
