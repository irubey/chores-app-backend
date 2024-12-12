import prisma from '../config/database';
import {
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  CreateReminderDTO,
  UpdateReminderDTO,
  Event,
  EventWithDetails,
  EventReminder,
  EventUpdateEvent,
  CreateEventDTO,
  UpdateEventDTO,
  UpdateEventStatusDTO,
  CalendarEventHistory,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces';
import {
  EventCategory,
  EventStatus,
  HouseholdRole,
  CalendarEventAction,
  EventReminderType,
} from '@shared/enums';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { getIO } from '../sockets';
import { verifyMembership } from './authService';
import {
  transformEventWithDetails,
  transformCalendarEventHistory,
  transformCreateEventDTO,
  transformEvent,
  transformEventReminder,
  transformUpdateEventDTO,
} from '../utils/transformers/eventTransformer';
import {
  PrismaEventBase,
  PrismaEventMinimal,
  PrismaEventReminderWithRelations,
  PrismaEventUpdateInput,
  PrismaEventWithFullRelations,
} from '../utils/transformers/transformerPrismaTypes';

function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

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

export async function getCalendarEvents(
  householdId: string,
  userId: string
): Promise<ApiResponse<EventWithDetails[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const events = (await prisma.event.findMany({
    where: {
      householdId,
      category: {
        not: EventCategory.CHORE,
      },
    },
    include: {
      reminders: true,
      createdBy: true,
      household: true,
      recurrenceRule: true,
      history: true,
    },
  })) as PrismaEventWithFullRelations[];

  const transformedEvents = events.map(transformEventWithDetails);
  return wrapResponse(transformedEvents);
}

export async function getEventById(
  householdId: string,
  eventId: string,
  userId: string
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = (await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      reminders: true,
      createdBy: true,
      household: true,
      recurrenceRule: true,
      history: true,
    },
  })) as PrismaEventWithFullRelations;

  if (!event || event.householdId !== householdId) {
    throw new NotFoundError('Calendar event not found.');
  }

  const transformedEvent = transformEventWithDetails(event);
  return wrapResponse(transformedEvent);
}

export async function createCalendarEvent(
  householdId: string,
  data: CreateCalendarEventDTO,
  userId: string
): Promise<ApiResponse<EventWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const event = await prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: transformCreateEventDTO({
        householdId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        createdById: userId,
        recurrenceRuleId: data.recurrenceId,
        category: data.category,
        isAllDay: data.isAllDay ?? false,
        location: data.location,
        isPrivate: data.isPrivate ?? false,
        reminders: data.reminders,
      }),
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
      },
    });

    await createCalendarEventHistory(
      tx,
      newEvent.id,
      CalendarEventAction.CREATED,
      userId
    );

    return newEvent;
  });

  const transformedEvent = transformEventWithDetails(
    event as PrismaEventWithFullRelations
  );

  getIO().to(`household_${householdId}`).emit('calendar_event_created', {
    action: CalendarEventAction.CREATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

export async function updateEvent(
  householdId: string,
  eventId: string,
  data: UpdateCalendarEventDTO,
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
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.householdId !== householdId) {
      throw new NotFoundError('Calendar event not found.');
    }

    const isRecurrenceChanged =
      existingEvent.recurrenceRuleId !== data.recurrenceId;

    const updatedEvent = (await tx.event.update({
      where: { id: eventId },
      data: transformUpdateEventDTO({
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        recurrenceRuleId: data.recurrenceId,
        category: data.category,
        isAllDay: data.isAllDay,
        location: data.location,
        isPrivate: data.isPrivate,
        reminders: data.reminders,
      }),
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
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

  getIO().to(`household_${householdId}`).emit('calendar_event_update', {
    action: CalendarEventAction.UPDATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

export async function deleteEvent(
  householdId: string,
  eventId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  await prisma.$transaction(async (tx) => {
    const existingEvent = await tx.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent || existingEvent.householdId !== householdId) {
      throw new NotFoundError('Calendar event not found.');
    }

    await createCalendarEventHistory(
      tx,
      eventId,
      CalendarEventAction.DELETED,
      userId
    );

    await tx.event.delete({
      where: { id: eventId },
    });
  });

  getIO().to(`household_${householdId}`).emit('calendar_event_deleted', {
    action: CalendarEventAction.DELETED,
    eventId,
  });

  return wrapResponse(undefined);
}

export async function addReminder(
  householdId: string,
  eventId: string,
  reminderData: CreateReminderDTO,
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
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.householdId !== householdId) {
      throw new NotFoundError('Calendar event not found.');
    }

    const updatedEvent = (await tx.event.update({
      where: { id: eventId },
      data: {
        reminders: {
          create: {
            time: reminderData.time,
            type: reminderData.type || EventReminderType.PUSH_NOTIFICATION,
          },
        },
      },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
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

  getIO().to(`household_${householdId}`).emit('calendar_event_update', {
    action: CalendarEventAction.UPDATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

export async function removeReminder(
  householdId: string,
  eventId: string,
  reminderId: string,
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
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.householdId !== householdId) {
      throw new NotFoundError('Calendar event not found.');
    }

    const updatedEvent = (await tx.event.update({
      where: { id: eventId },
      data: {
        reminders: {
          delete: { id: reminderId },
        },
      },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
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

  getIO().to(`household_${householdId}`).emit('calendar_event_update', {
    action: CalendarEventAction.UPDATED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

export async function getEventsByDate(
  householdId: string,
  date: Date,
  userId: string
): Promise<ApiResponse<EventWithDetails[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const events = (await prisma.event.findMany({
    where: {
      householdId,
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      deletedAt: null,
    },
    include: {
      reminders: true,
      createdBy: true,
      household: true,
      recurrenceRule: true,
      history: true,
    },
  })) as PrismaEventWithFullRelations[];

  const transformedEvents = events.map(transformEventWithDetails);
  return wrapResponse(transformedEvents);
}

export async function updateEventStatus(
  householdId: string,
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
        recurrenceRule: true,
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.householdId !== householdId) {
      throw new NotFoundError('Calendar event not found.');
    }

    const updatedEvent = (await tx.event.update({
      where: { id: eventId },
      data: transformUpdateEventDTO({ status }),
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
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

  getIO().to(`household_${householdId}`).emit('calendar_event_update', {
    action: CalendarEventAction.STATUS_CHANGED,
    event: transformedEvent,
  });

  return wrapResponse(transformedEvent);
}

export async function deleteCalendarEvent(
  householdId: string,
  eventId: string,
  userId: string
): Promise<ApiResponse<void>> {
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
        recurrenceRule: true,
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    if (!existingEvent || existingEvent.householdId !== householdId) {
      throw new NotFoundError('Calendar event not found.');
    }

    // Soft delete the event
    const deletedEvent = (await tx.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
      },
      include: {
        reminders: true,
        createdBy: true,
        household: true,
        recurrenceRule: true,
        history: true,
      },
    })) as PrismaEventWithFullRelations;

    await createCalendarEventHistory(
      tx,
      eventId,
      CalendarEventAction.DELETED,
      userId
    );

    return deletedEvent;
  });

  const transformedEvent = transformEventWithDetails(event);

  getIO().to(`household_${householdId}`).emit('calendar_event_update', {
    action: CalendarEventAction.DELETED,
    event: transformedEvent,
  });

  return wrapResponse(undefined);
}
