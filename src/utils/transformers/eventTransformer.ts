import {
  Event,
  EventReminder,
  EventWithDetails,
  CreateEventDTO,
  UpdateEventDTO,
  CreateReminderDTO,
  UpdateReminderDTO,
  CalendarEventHistory,
} from '@shared/types';
import {
  EventCategory,
  EventStatus,
  EventReminderType,
  CalendarEventAction,
} from '@shared/enums';
import {
  PrismaEventWithFullRelations,
  PrismaEventReminderWithRelations,
  PrismaEventBase,
  PrismaEventUpdateInput,
} from './transformerPrismaTypes';
import { transformChoreToChoreWithAssignees } from './choreTransformer';
import { transformUser } from './userTransformer';
import { transformHousehold } from './householdTransformer';
import { transformPollWithDetails } from './messageTransformer/poll';
import { transformRecurrenceRule } from './recurrenceRuleTransformer';

function isValidEventCategory(category: string): category is EventCategory {
  return Object.values(EventCategory).includes(category as EventCategory);
}

function isValidEventStatus(status: string): status is EventStatus {
  return Object.values(EventStatus).includes(status as EventStatus);
}

function isValidEventReminderType(type: string): type is EventReminderType {
  return Object.values(EventReminderType).includes(type as EventReminderType);
}

export function transformEventReminder(
  reminder: PrismaEventReminderWithRelations
): EventReminder {
  return {
    id: reminder.id,
    eventId: reminder.eventId,
    time: reminder.time,
    type: isValidEventReminderType(reminder.type)
      ? reminder.type
      : EventReminderType.PUSH_NOTIFICATION,
  };
}

export function transformCalendarEventHistory(
  history: PrismaEventWithFullRelations['history'][0]
): CalendarEventHistory {
  return {
    id: history.id,
    eventId: history.eventId,
    action: history.action as CalendarEventAction,
    changedById: history.changedById,
    changedAt: history.changedAt,
  };
}

export function transformEvent(event: PrismaEventWithFullRelations): Event {
  return {
    id: event.id,
    householdId: event.householdId,
    title: event.title,
    description: event.description ?? undefined,
    startTime: event.startTime,
    endTime: event.endTime,
    createdById: event.createdById,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    choreId: event.choreId ?? undefined,
    recurrenceRuleId: event.recurrenceRuleId ?? undefined,
    category: isValidEventCategory(event.category)
      ? event.category
      : EventCategory.OTHER,
    isAllDay: event.isAllDay,
    location: event.location ?? undefined,
    isPrivate: event.isPrivate,
    status: isValidEventStatus(event.status)
      ? event.status
      : EventStatus.SCHEDULED,
    deletedAt: event.deletedAt ?? undefined,
  };
}

export function transformEventWithDetails(
  event: PrismaEventWithFullRelations
): EventWithDetails {
  return {
    ...transformEvent(event),
    reminders: event.reminders.map(transformEventReminder),
    household: transformHousehold(event.household),
    createdBy: transformUser(event.createdBy),
    chore: event.chore
      ? transformChoreToChoreWithAssignees(event.chore)
      : undefined,
    recurrenceRule: event.recurrenceRule
      ? transformRecurrenceRule(event.recurrenceRule)
      : undefined,
    history: event.history.map(transformCalendarEventHistory),
    poll: event.poll ? transformPollWithDetails(event.poll) : undefined,
  };
}

export function transformCreateEventDTO(
  dto: CreateEventDTO
): Omit<PrismaEventBase, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  return {
    householdId: dto.householdId,
    title: dto.title,
    description: dto.description ?? null,
    startTime: dto.startTime,
    endTime: dto.endTime,
    createdById: dto.createdById,
    choreId: dto.choreId ?? null,
    recurrenceRuleId: dto.recurrenceRuleId ?? null,
    category: isValidEventCategory(dto.category)
      ? dto.category
      : EventCategory.OTHER,
    isAllDay: dto.isAllDay,
    location: dto.location ?? null,
    isPrivate: dto.isPrivate,
    status: EventStatus.SCHEDULED,
  };
}

export function transformUpdateEventDTO(
  dto: UpdateEventDTO
): PrismaEventUpdateInput {
  const transformed: PrismaEventUpdateInput = {};

  if (dto.title !== undefined) transformed.title = dto.title;
  if (dto.description !== undefined)
    transformed.description = dto.description ?? null;
  if (dto.startTime !== undefined) transformed.startTime = dto.startTime;
  if (dto.endTime !== undefined) transformed.endTime = dto.endTime;
  if (dto.choreId !== undefined) transformed.choreId = dto.choreId;
  if (dto.recurrenceRuleId !== undefined) {
    transformed.recurrenceRule = {
      connect: { id: dto.recurrenceRuleId },
    };
  }
  if (dto.category !== undefined) {
    transformed.category = isValidEventCategory(dto.category)
      ? dto.category
      : EventCategory.OTHER;
  }
  if (dto.status !== undefined) {
    transformed.status = isValidEventStatus(dto.status)
      ? dto.status
      : EventStatus.SCHEDULED;
  }
  if (dto.isAllDay !== undefined) transformed.isAllDay = dto.isAllDay;
  if (dto.location !== undefined) transformed.location = dto.location ?? null;
  if (dto.isPrivate !== undefined) transformed.isPrivate = dto.isPrivate;

  // Handle reminders if needed
  if (dto.reminders) {
    transformed.reminders = {
      deleteMany: {},
      create: dto.reminders.map((reminder) => ({
        time: reminder.time,
        type: reminder.type,
      })),
    };
  }

  return transformed;
}
