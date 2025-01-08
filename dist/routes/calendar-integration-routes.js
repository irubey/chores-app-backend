"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendarIntegrationController_1 = require("../controllers/calendarIntegrationController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   POST /api/households/:householdId/calendar/sync
 * @desc    Sync household calendar with a user's personal calendar
 * @access  Protected
 */
router.post("/sync", authMiddleware_1.authMiddleware, (0, validationMiddleware_1.validate)(validationSchemas_1.syncCalendarSchema), (0, asyncHandler_1.asyncHandler)(calendarIntegrationController_1.CalendarIntegrationController.syncWithPersonalCalendar));
exports.default = router;
