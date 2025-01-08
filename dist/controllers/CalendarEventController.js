"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventController = void 0;
const calendarEventService = __importStar(require("../services/calendarEventService"));
/**
 * CalendarEventController handles all CRUD operations related to general calendar events.
 */
class CalendarEventController {
    /**
     * Retrieves all general calendar events for a household.
     */
    static async getCalendarEvents(req, res, next) {
        try {
            const { householdId } = req.params;
            if (!householdId) {
                throw new Error("Household ID is required");
            }
            const response = await calendarEventService.getCalendarEvents(householdId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new general calendar event.
     */
    static async createCalendarEvent(req, res, next) {
        try {
            const { householdId } = req.params;
            if (!householdId) {
                throw new Error("Household ID is required");
            }
            const eventData = req.body;
            const response = await calendarEventService.createCalendarEvent(householdId, eventData, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific general calendar event.
     */
    static async getEventById(req, res, next) {
        try {
            const { householdId, eventId } = req.params;
            if (!householdId || !eventId) {
                throw new Error("Household ID and Event ID are required");
            }
            const response = await calendarEventService.getEventById(householdId, eventId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing general calendar event.
     */
    static async updateEvent(req, res, next) {
        try {
            const { householdId, eventId } = req.params;
            if (!householdId || !eventId) {
                throw new Error("Household ID and Event ID are required");
            }
            const updateData = req.body;
            const response = await calendarEventService.updateEvent(householdId, eventId, updateData, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a general calendar event.
     */
    static async deleteEvent(req, res, next) {
        try {
            const { householdId, eventId } = req.params;
            if (!householdId || !eventId) {
                throw new Error("Household ID and Event ID are required");
            }
            await calendarEventService.deleteCalendarEvent(householdId, eventId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Adds a reminder to a calendar event.
     */
    static async addReminder(req, res, next) {
        try {
            const { householdId, eventId } = req.params;
            if (!householdId || !eventId) {
                throw new Error("Household ID and Event ID are required");
            }
            const reminderData = req.body;
            const response = await calendarEventService.addReminder(householdId, eventId, reminderData, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Removes a reminder from a calendar event.
     */
    static async removeReminder(req, res, next) {
        try {
            const { householdId, eventId, reminderId } = req.params;
            if (!householdId || !eventId || !reminderId) {
                throw new Error("Household ID, Event ID, and Reminder ID are required");
            }
            await calendarEventService.removeReminder(householdId, eventId, reminderId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves events for a specific date.
     */
    static async getEventsByDate(req, res, next) {
        try {
            const { householdId, date } = req.params;
            if (!householdId || !date) {
                throw new Error("Household ID and Date are required");
            }
            const response = await calendarEventService.getEventsByDate(householdId, new Date(date), req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CalendarEventController = CalendarEventController;
