"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarEvents = getCalendarEvents;
exports.getEventById = getEventById;
exports.createCalendarEvent = createCalendarEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
exports.addReminder = addReminder;
exports.removeReminder = removeReminder;
exports.getEventsByDate = getEventsByDate;
exports.updateEventStatus = updateEventStatus;
exports.deleteCalendarEvent = deleteCalendarEvent;
const database_1 = __importDefault(require("../config/database"));
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const errorHandler_1 = require("../middlewares/errorHandler");
const sockets_1 = require("../sockets");
const authService_1 = require("./authService");
const eventTransformer_1 = require("../utils/transformers/eventTransformer");
function wrapResponse(data) {
    return { data };
}
async function createCalendarEventHistory(tx, eventId, action, userId) {
    await tx.calendarEventHistory.create({
        data: {
            eventId,
            action,
            changedById: userId,
        },
    });
}
async function getCalendarEvents(householdId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const events = (await database_1.default.event.findMany({
        where: {
            householdId,
            category: {
                not: enums_1.EventCategory.CHORE,
            },
        },
        include: {
            reminders: true,
            createdBy: true,
            household: true,
            recurrenceRule: true,
            history: true,
        },
    }));
    const transformedEvents = events.map(eventTransformer_1.transformEventWithDetails);
    return wrapResponse(transformedEvents);
}
async function getEventById(householdId, eventId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = (await database_1.default.event.findUnique({
        where: { id: eventId },
        include: {
            reminders: true,
            createdBy: true,
            household: true,
            recurrenceRule: true,
            history: true,
        },
    }));
    if (!event || event.householdId !== householdId) {
        throw new errorHandler_1.NotFoundError('Calendar event not found.');
    }
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    return wrapResponse(transformedEvent);
}
async function createCalendarEvent(householdId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const event = await database_1.default.$transaction(async (tx) => {
        const newEvent = await tx.event.create({
            data: (0, eventTransformer_1.transformCreateEventDTO)({
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
        await createCalendarEventHistory(tx, newEvent.id, enums_1.CalendarEventAction.CREATED, userId);
        return newEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_created', {
        action: enums_1.CalendarEventAction.CREATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
async function updateEvent(householdId, eventId, data, userId) {
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
                recurrenceRule: true,
                history: true,
            },
        }));
        if (!existingEvent || existingEvent.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Calendar event not found.');
        }
        const isRecurrenceChanged = existingEvent.recurrenceRuleId !== data.recurrenceId;
        const updatedEvent = (await tx.event.update({
            where: { id: eventId },
            data: (0, eventTransformer_1.transformUpdateEventDTO)({
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
        }));
        if (isRecurrenceChanged) {
            await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.RECURRENCE_CHANGED, userId);
        }
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.UPDATED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_update', {
        action: enums_1.CalendarEventAction.UPDATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
async function deleteEvent(householdId, eventId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    await database_1.default.$transaction(async (tx) => {
        const existingEvent = await tx.event.findUnique({
            where: { id: eventId },
        });
        if (!existingEvent || existingEvent.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Calendar event not found.');
        }
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.DELETED, userId);
        await tx.event.delete({
            where: { id: eventId },
        });
    });
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_deleted', {
        action: enums_1.CalendarEventAction.DELETED,
        eventId,
    });
    return wrapResponse(undefined);
}
async function addReminder(householdId, eventId, reminderData, userId) {
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
                recurrenceRule: true,
                history: true,
            },
        }));
        if (!existingEvent || existingEvent.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Calendar event not found.');
        }
        const updatedEvent = (await tx.event.update({
            where: { id: eventId },
            data: {
                reminders: {
                    create: {
                        time: reminderData.time,
                        type: reminderData.type || enums_1.EventReminderType.PUSH_NOTIFICATION,
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
        }));
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.UPDATED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_update', {
        action: enums_1.CalendarEventAction.UPDATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
async function removeReminder(householdId, eventId, reminderId, userId) {
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
                recurrenceRule: true,
                history: true,
            },
        }));
        if (!existingEvent || existingEvent.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Calendar event not found.');
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
        }));
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.UPDATED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_update', {
        action: enums_1.CalendarEventAction.UPDATED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
async function getEventsByDate(householdId, date, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const events = (await database_1.default.event.findMany({
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
    }));
    const transformedEvents = events.map(eventTransformer_1.transformEventWithDetails);
    return wrapResponse(transformedEvents);
}
async function updateEventStatus(householdId, eventId, userId, status) {
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
                recurrenceRule: true,
                history: true,
            },
        }));
        if (!existingEvent || existingEvent.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Calendar event not found.');
        }
        const updatedEvent = (await tx.event.update({
            where: { id: eventId },
            data: (0, eventTransformer_1.transformUpdateEventDTO)({ status }),
            include: {
                reminders: true,
                createdBy: true,
                household: true,
                recurrenceRule: true,
                history: true,
            },
        }));
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.STATUS_CHANGED, userId);
        return updatedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_update', {
        action: enums_1.CalendarEventAction.STATUS_CHANGED,
        event: transformedEvent,
    });
    return wrapResponse(transformedEvent);
}
async function deleteCalendarEvent(householdId, eventId, userId) {
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
                recurrenceRule: true,
                history: true,
            },
        }));
        if (!existingEvent || existingEvent.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Calendar event not found.');
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
        }));
        await createCalendarEventHistory(tx, eventId, enums_1.CalendarEventAction.DELETED, userId);
        return deletedEvent;
    });
    const transformedEvent = (0, eventTransformer_1.transformEventWithDetails)(event);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('calendar_event_update', {
        action: enums_1.CalendarEventAction.DELETED,
        event: transformedEvent,
    });
    return wrapResponse(undefined);
}
