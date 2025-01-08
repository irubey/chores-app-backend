"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformEventReminder = transformEventReminder;
exports.transformCalendarEventHistory = transformCalendarEventHistory;
exports.transformEvent = transformEvent;
exports.transformEventWithDetails = transformEventWithDetails;
exports.transformCreateEventDTO = transformCreateEventDTO;
exports.transformUpdateEventDTO = transformUpdateEventDTO;
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const choreTransformer_1 = require("./choreTransformer");
const userTransformer_1 = require("./userTransformer");
const householdTransformer_1 = require("./householdTransformer");
const poll_1 = require("./messageTransformer/poll");
const recurrenceRuleTransformer_1 = require("./recurrenceRuleTransformer");
function isValidEventCategory(category) {
    return Object.values(enums_1.EventCategory).includes(category);
}
function isValidEventStatus(status) {
    return Object.values(enums_1.EventStatus).includes(status);
}
function isValidEventReminderType(type) {
    return Object.values(enums_1.EventReminderType).includes(type);
}
function transformEventReminder(reminder) {
    return {
        id: reminder.id,
        eventId: reminder.eventId,
        time: reminder.time,
        type: isValidEventReminderType(reminder.type)
            ? reminder.type
            : enums_1.EventReminderType.PUSH_NOTIFICATION,
    };
}
function transformCalendarEventHistory(history) {
    return {
        id: history.id,
        eventId: history.eventId,
        action: history.action,
        changedById: history.changedById,
        changedAt: history.changedAt,
    };
}
function transformEvent(event) {
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
            : enums_1.EventCategory.OTHER,
        isAllDay: event.isAllDay,
        location: event.location ?? undefined,
        isPrivate: event.isPrivate,
        status: isValidEventStatus(event.status)
            ? event.status
            : enums_1.EventStatus.SCHEDULED,
        deletedAt: event.deletedAt ?? undefined,
    };
}
function transformChoreForEvent(chore) {
    if (!chore)
        return undefined;
    const transformedChore = (0, choreTransformer_1.transformChoreToChoreWithAssignees)(chore);
    return {
        ...transformedChore,
        swapRequests: chore.choreSwapRequests?.map((request) => ({
            id: request.id,
            choreId: request.choreId,
            requestingUserId: request.requestingUserId,
            targetUserId: request.targetUserId,
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
        })) || [],
    };
}
function transformEventWithDetails(event) {
    return {
        ...transformEvent(event),
        reminders: event.reminders.map(transformEventReminder),
        household: (0, householdTransformer_1.transformHousehold)(event.household),
        createdBy: (0, userTransformer_1.transformUser)(event.createdBy),
        chore: transformChoreForEvent(event.chore),
        recurrenceRule: event.recurrenceRule
            ? (0, recurrenceRuleTransformer_1.transformRecurrenceRule)(event.recurrenceRule)
            : undefined,
        history: event.history.map(transformCalendarEventHistory),
        poll: event.poll ? (0, poll_1.transformPollWithDetails)(event.poll) : undefined,
    };
}
function transformCreateEventDTO(dto) {
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
            : enums_1.EventCategory.OTHER,
        isAllDay: dto.isAllDay,
        location: dto.location ?? null,
        isPrivate: dto.isPrivate,
        status: enums_1.EventStatus.SCHEDULED,
    };
}
function transformUpdateEventDTO(dto) {
    const transformed = {};
    if (dto.title !== undefined)
        transformed.title = dto.title;
    if (dto.description !== undefined)
        transformed.description = dto.description ?? null;
    if (dto.startTime !== undefined)
        transformed.startTime = dto.startTime;
    if (dto.endTime !== undefined)
        transformed.endTime = dto.endTime;
    if (dto.choreId !== undefined)
        transformed.choreId = dto.choreId;
    if (dto.recurrenceRuleId !== undefined) {
        transformed.recurrenceRule = {
            connect: { id: dto.recurrenceRuleId },
        };
    }
    if (dto.category !== undefined) {
        transformed.category = isValidEventCategory(dto.category)
            ? dto.category
            : enums_1.EventCategory.OTHER;
    }
    if (dto.status !== undefined) {
        transformed.status = isValidEventStatus(dto.status)
            ? dto.status
            : enums_1.EventStatus.SCHEDULED;
    }
    if (dto.isAllDay !== undefined)
        transformed.isAllDay = dto.isAllDay;
    if (dto.location !== undefined)
        transformed.location = dto.location ?? null;
    if (dto.isPrivate !== undefined)
        transformed.isPrivate = dto.isPrivate;
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
