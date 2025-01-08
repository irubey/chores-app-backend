"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChoreEvents = getChoreEvents;
exports.createChoreEvent = createChoreEvent;
exports.getChoreEventById = getChoreEventById;
exports.updateChoreEvent = updateChoreEvent;
exports.deleteChoreEvent = deleteChoreEvent;
exports.updateChoreEventStatus = updateChoreEventStatus;
exports.rescheduleChoreEvent = rescheduleChoreEvent;
exports.getUpcomingChoreEvents = getUpcomingChoreEvents;
const database_1 = __importDefault(require("../config/database"));
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const errorHandler_1 = require("../middlewares/errorHandler");
const sockets_1 = require("../sockets");
const authService_1 = require("./authService");
const eventTransformer_1 = require("../utils/transformers/eventTransformer");
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
// Helper function to create calendar event history record
async function createCalendarEventHistory(tx, eventId, action, userId) {
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
async function getChoreEvents(householdId, choreId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const events = (await database_1.default.event.findMany({
        where: {
            householdId,
            choreId,
            category: enums_1.EventCategory.CHORE,
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
    }));
    const transformedEvents = events.map(eventTransformer_1.transformEventWithDetails);
    return wrapResponse(transformedEvents);
}
/**
 * Creates a new event associated with a chore.
 */
async function createChoreEvent(householdId, choreId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = await database_1.default.$transaction(async (tx) => {
        const chore = await tx.chore.findUnique({
            where: { id: choreId },
        });
        if (!chore) {
            throw new errorHandler_1.NotFoundError('Chore not found.');
        }
        const newEvent = (await tx.event.create({
            data: {
                ...(0, eventTransformer_1.transformCreateEventDTO)({
                    ...data,
                    householdId,
                    createdById: userId,
                    choreId,
                    category: enums_1.EventCategory.CHORE,
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
        }));
        await createCalendarEventHistory(tx, newEvent.id, enums_1.CalendarEventAction.CREATED, userId);
        return newEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('event_update', {
        action: enums_1.CalendarEventAction.CREATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
/**
 * Retrieves details of a specific chore event.
 */
async function getChoreEventById(householdId, choreId, eventId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = (await database_1.default.event.findUnique({
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
    }));
    if (!event) {
        throw new errorHandler_1.NotFoundError('Chore event not found.');
    }
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    return wrapResponse(transformedEvent);
}
/**
 * Updates an existing chore event.
 */
async function updateChoreEvent(householdId, choreId, eventId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = await database_1.default.$transaction(async (tx) => {
        const existingEvent = (await tx.event.findUnique({
            where: { id: eventId },
            include: {
                reminders: true,
                recurrenceRule: true,
            },
        }));
        if (!existingEvent || existingEvent.choreId !== choreId) {
            throw new errorHandler_1.NotFoundError('Chore event not found.');
        }
        const isRecurrenceChanged = existingEvent.recurrenceRuleId !== data.recurrenceRuleId;
        const updatedEvent = (await tx.event.update({
            where: { id: eventId },
            data: (0, eventTransformer_1.transformUpdateEventDTO)(data),
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
        }));
        if (isRecurrenceChanged) {
            await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.RECURRENCE_CHANGED, userId);
        }
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.UPDATED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('event_update', {
        action: enums_1.CalendarEventAction.UPDATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
/**
 * Deletes a chore-linked event.
 */
async function deleteChoreEvent(householdId, choreId, eventId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    await database_1.default.event.delete({
        where: {
            id: eventId,
            choreId: choreId,
            householdId: householdId,
        },
    });
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('chore_event_deleted', { eventId });
    return wrapResponse(undefined);
}
/**
 * Updates the status of a chore event.
 */
async function updateChoreEventStatus(householdId, choreId, eventId, userId, status) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = await database_1.default.$transaction(async (tx) => {
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
        }));
        if (!existingEvent || existingEvent.choreId !== choreId) {
            throw new errorHandler_1.NotFoundError('Chore event not found.');
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
        }));
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.STATUS_CHANGED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('event_update', {
        action: enums_1.CalendarEventAction.STATUS_CHANGED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
/**
 * Reschedules a chore event.
 */
async function rescheduleChoreEvent(householdId, choreId, eventId, userId, newStartTime, newEndTime) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = await database_1.default.$transaction(async (tx) => {
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
        }));
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.UPDATED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('event_update', {
        action: enums_1.CalendarEventAction.UPDATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
/**
 * Retrieves upcoming chore events.
 */
async function getUpcomingChoreEvents(householdId, choreId, userId, limit) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const events = (await database_1.default.event.findMany({
        where: {
            choreId,
            householdId,
            category: enums_1.EventCategory.CHORE,
            status: enums_1.EventStatus.SCHEDULED,
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
    }));
    const transformedEvents = events.map(eventTransformer_1.transformEventWithDetails);
    return wrapResponse(transformedEvents);
}
