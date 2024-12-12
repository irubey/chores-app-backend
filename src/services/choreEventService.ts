import prisma from '../config/database';
import {
  CreateEventDTO,
  EventWithDetails,
  UpdateEventDTO,
  Event,
  EventReminder,
  EventUpdateEvent,
  UpdateEventStatusDTO,
  CalendarEventHistory,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces';
import {
  HouseholdRole,
  EventCategory,
  EventStatus,
  CalendarEventAction,
} from '@shared/enums';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { getIO } from '../sockets';
import { verifyMembership } from './authService';
import {
  transformEventWithDetails,
  transformCreateEventDTO,
  transformEvent,
  transformEventReminder,
  transformUpdateEventDTO,
} from '../utils/transformers/eventTransformer';
import {
  PrismaEventBase,
  PrismaEventWithFullRelations,
  PrismaEventMinimal,
  PrismaEventReminderWithRelations,
} from '../utils/transformers/transformerPrismaTypes';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Helper function to create calendar event history record
async function createCalendarEventHistory(
  tx: any,
  eventId: string,
  action: CalendarEventAction,
  userId: string
): Promise<void> {
  await tx.calendarEventHistory.create({
    data: {
      eventId,
      action,
      changedById: userId,
    },
  });
}

/**
 * Retrieves all events linked to a specific chore.
 */
export async function getChoreEvents(
  householdId: string,
  choreId: string,
  userId: string
): Promise<ApiResponse<EventWithDetails[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const events = (await prisma.event.findMany({
    where: {
      householdId,
      choreId,
      category: EventCategory.CHORE,
    },
    include: {
      reminders: true,
      createdBy: true,
      household: true,
      chore: {
        include: {
          subtasks: true,
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
      history: true,
    },
  })) as PrismaEventWithFullRelations[];

  const transformedEvents = events.map(transformEventWithDetails);
  return wrapResponse(transformedEvents);
}

/**
 * Creates a new event associated with a chore.
 */
export async function createChoreEvent(
  householdId: string,
  choreId: string,
  data: CreateEventDTO,
  userId: string
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = await prisma.$transaction(async (tx) => {
    const chore = await tx.chore.findUnique({
      where: { id: choreId },
    });

    if (!chore) {
      throw new NotFoundError('Chore not found.');
    }

    const newEvent = (await tx.event.create({
      data: {
        ...transformCreateEventDTO({
          ...data,
          householdId,
          createdById: userId,
          choreId,
          category: EventCategory.CHORE,
        }),
        reminders: data.reminders
          ? {
            create: data.reminders,
          }
          : undefined,
      },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        chore: {
          include: {
            subtasks: true,
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    await createCalendarEventHistory(
      tx,
      newEvent.id,
      CalendarEventAction.CREATED,
      userId
    );

    return newEvent;
  });

  const transformedEvent = transformEventWithDetails(event);

  getIO().to(`household_${householdId}`).emit('event_update', {
    action: CalendarEventAction.CREATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

/**
 * Retrieves details of a specific chore event.
 */
export async function getChoreEventById(
  householdId: string,
  choreId: string,
  eventId: string,
  userId: string
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = (await prisma.event.findUnique({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
    include: {
      reminders: true,
      createdBy: true,
      household: true,
      chore: {
        include: {
          subtasks: true,
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
      history: true,
      recurrenceRule: true,
    },
  })) as PrismaEventWithFullRelations;

  if (!event) {
    throw new NotFoundError('Chore event not found.');
  }

  const transformedEvent = transformEventWithDetails(event);
  return wrapResponse(transformedEvent);
}

/**
 * Updates an existing chore event.
 */
export async function updateChoreEvent(
  householdId: string,
  choreId: string,
  eventId: string,
  data: UpdateEventDTO,
  userId: string
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = await prisma.$transaction(async (tx) => {
    const existingEvent = (await tx.event.findUnique({
      where: { id: eventId },
      include: {
        reminders: true,
        recurrenceRule: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.choreId !== choreId) {
      throw new NotFoundError('Chore event not found.');
    }

    const isRecurrenceChanged =
      existingEvent.recurrenceRuleId !== data.recurrenceRuleId;

    const updatedEvent = (await tx.event.update({
      where: { id: eventId },
      data: transformUpdateEventDTO(data),
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        chore: {
          include: {
            subtasks: true,
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
        history: true,
        recurrenceRule: true,
      },
    })) as PrismaEventWithFullRelations;

    if (isRecurrenceChanged) {
      await createCalendarEventHistory(
        tx,
        eventId,
        CalendarEventAction.RECURRENCE_CHANGED,
        userId
      );
    }

    await createCalendarEventHistory(
      tx,
      eventId,
      CalendarEventAction.UPDATED,
      userId
    );

    return updatedEvent;
  });

  const transformedEvent = transformEventWithDetails(event);

  getIO().to(`household_${householdId}`).emit('event_update', {
    action: CalendarEventAction.UPDATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

/**
 * Deletes a chore-linked event.
 */
export async function deleteChoreEvent(
  householdId: string,
  choreId: string,
  eventId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  await prisma.event.delete({
    where: {
      id: eventId,
      choreId: choreId,
      householdId: householdId,
    },
  });

  getIO()
    .to(`household_${householdId}`)
    .emit('chore_event_deleted', { eventId });

  return wrapResponse(undefined);
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
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = await prisma.$transaction(async (tx) => {
    const existingEvent = (await tx.event.findUnique({
      where: { id: eventId },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        chore: {
          include: {
            subtasks: true,
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
        history: true,
        recurrenceRule: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.choreId !== choreId) {
      throw new NotFoundError('Chore event not found.');
    }

    const updatedEvent = (await tx.event.update({
      where: { id: eventId },
      data: { status },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        chore: {
          include: {
            subtasks: true,
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
        history: true,
        recurrenceRule: true,
      },
    })) as PrismaEventWithFullRelations;

    await createCalendarEventHistory(
      tx,
      eventId,
      CalendarEventAction.STATUS_CHANGED,
      userId
    );

    return updatedEvent;
  });

  const transformedEvent = transformEventWithDetails(event);

  getIO().to(`household_${householdId}`).emit('event_update', {
    action: CalendarEventAction.STATUS_CHANGED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
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
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = await prisma.$transaction(async (tx) => {
    const updatedEvent = (await tx.event.update({
      where: {
        id: eventId,
        choreId,
        householdId,
      },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
      },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        chore: {
          include: {
            subtasks: true,
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
        history: true,
        recurrenceRule: true,
      },
    })) as PrismaEventWithFullRelations;

    await createCalendarEventHistory(
      tx,
      eventId,
      CalendarEventAction.UPDATED,
      userId
    );

    return updatedEvent;
  });

  const transformedEvent = transformEventWithDetails(event);

  getIO().to(`household_${householdId}`).emit('event_update', {
    action: CalendarEventAction.UPDATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

/**
 * Retrieves upcoming chore events.
 */
export async function getUpcomingChoreEvents(
  householdId: string,
  choreId: string,
  userId: string,
  limit?: number
): Promise<ApiResponse<EventWithDetails[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const events = (await prisma.event.findMany({
    where: {
      choreId,
      householdId,
      category: EventCategory.CHORE,
      status: EventStatus.SCHEDULED,
    },
    include: {
      reminders: true,
      createdBy: true,
      household: true,
      chore: {
        include: {
          subtasks: true,
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
      history: true,
      recurrenceRule: true,
    },
    orderBy: {
      startTime: 'asc',
    },
    take: limit,
  })) as PrismaEventWithFullRelations[];

  const transformedEvents = events.map(transformEventWithDetails);
  return wrapResponse(transformedEvents);
}
