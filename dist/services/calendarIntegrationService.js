"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncWithPersonalCalendar = syncWithPersonalCalendar;
const axios_1 = __importDefault(require("axios"));
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * Syncs the household calendar with a user's personal calendar (e.g., Google Calendar).
 * This function assumes OAuth tokens are stored and managed appropriately.
 */
async function syncWithPersonalCalendar(householdId, userId, accessToken) {
    // Verify user is a member of the household
    const membership = await database_1.default.householdMember.findUnique({
        where: {
            userId_householdId: { userId, householdId },
        },
        include: {
            user: true,
        },
    });
    if (!membership) {
        throw new errorHandler_1.UnauthorizedError('You do not have access to this household.');
    }
    // Fetch household events
    const events = await database_1.default.event.findMany({
        where: { householdId },
    });
    // Prepare events for synchronization
    const calendarEvents = events.map((event) => ({
        summary: event.title,
        description: event.description,
        start: {
            dateTime: event.startTime.toISOString(),
            timeZone: 'UTC', // Adjust as necessary
        },
        end: {
            dateTime: event.endTime.toISOString(),
            timeZone: 'UTC', // Adjust as necessary
        },
        // Additional fields as needed
    }));
    try {
        // Example with Google Calendar API
        const response = await axios_1.default.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            items: calendarEvents,
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        // Handle response as needed
        return response.data;
    }
    catch (error) {
        console.error('Error syncing with personal calendar:', error);
        throw new Error('Failed to sync with personal calendar.');
    }
}
