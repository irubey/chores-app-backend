"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChoreEventController_1 = require("../controllers/ChoreEventController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/chores/:choreId/events
 * @desc    Retrieve all events linked to a specific chore
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.getChoreEvents));
/**
 * @route   POST /api/households/:householdId/chores/:choreId/events
 * @desc    Create a new event linked to a chore
 * @access  Protected, Write access required
 */
router.post("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.createChoreEvent));
/**
 * @route   GET /api/households/:householdId/chores/:choreId/events/:eventId
 * @desc    Retrieve details of a specific chore event
 * @access  Protected
 */
router.get("/:eventId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.getChoreEventById));
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId/events/:eventId
 * @desc    Update an existing chore-linked event
 * @access  Protected, Write access required
 */
router.patch("/:eventId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.updateChoreEvent));
/**
 * @route   DELETE /api/households/:householdId/chores/:choreId/events/:eventId
 * @desc    Delete a chore-linked event
 * @access  Protected, Admin access required
 */
router.delete("/:eventId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.deleteChoreEvent));
/**
 * @route   POST /api/households/:householdId/chores/:choreId/events/:eventId/complete
 * @desc    Mark a chore event as completed
 * @access  Protected, Write access required
 */
router.post("/:eventId/complete", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.updateChoreEventStatus));
/**
 * @route   POST /api/households/:householdId/chores/:choreId/events/:eventId/reschedule
 * @desc    Reschedule a chore event
 * @access  Protected, Write access required
 */
router.post("/:eventId/reschedule", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.rescheduleChoreEvent));
/**
 * @route   GET /api/households/:householdId/chores/:choreId/events/upcoming
 * @desc    Get upcoming chore events
 * @access  Protected
 */
router.get("/upcoming", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ChoreEventController_1.ChoreEventController.getUpcomingChoreEvents));
exports.default = router;
