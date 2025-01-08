"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CalendarEventController_1 = require("../controllers/CalendarEventController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/calendar/events
 * @desc    Retrieve all general calendar events for a household
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.getCalendarEvents));
/**
 * @route   POST /api/households/:householdId/calendar/events
 * @desc    Create a new general calendar event
 * @access  Protected, Write access required
 */
router.post("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.createCalendarEvent));
/**
 * @route   GET /api/households/:householdId/calendar/events/:eventId
 * @desc    Retrieve details of a specific general calendar event
 * @access  Protected
 */
router.get("/:eventId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.getEventById));
/**
 * @route   PATCH /api/households/:householdId/calendar/events/:eventId
 * @desc    Update an existing general calendar event
 * @access  Protected, Write access required
 */
router.patch("/:eventId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.updateEvent));
/**
 * @route   DELETE /api/households/:householdId/calendar/events/:eventId
 * @desc    Delete a general calendar event
 * @access  Protected, Admin access required
 */
router.delete("/:eventId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.deleteEvent));
/**
 * @route   POST /api/households/:householdId/calendar/events/:eventId/reminders
 * @desc    Add a reminder to a calendar event
 * @access  Protected, Write access required
 */
router.post("/:eventId/reminders", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.addReminder));
/**
 * @route   DELETE /api/households/:householdId/calendar/events/:eventId/reminders/:reminderId
 * @desc    Remove a reminder from a calendar event
 * @access  Protected, Write access required
 */
router.delete("/:eventId/reminders/:reminderId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.removeReminder));
/**
 * @route   GET /api/households/:householdId/calendar/events/date/:date
 * @desc    Get events for a specific date
 * @access  Protected
 */
router.get("/date/:date", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(CalendarEventController_1.CalendarEventController.getEventsByDate));
exports.default = router;
