"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SubtaskController_1 = require("../controllers/SubtaskController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Retrieve all subtasks for a specific chore
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(SubtaskController_1.SubtaskController.getSubtasks));
/**
 * @route   POST /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Add a new subtask to a specific chore
 * @access  Protected, Write access required
 */
router.post("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.createSubtaskSchema), (0, asyncHandler_1.asyncHandler)(SubtaskController_1.SubtaskController.addSubtask));
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId/subtasks/:subtaskId
 * @desc    Update a specific subtask's details
 * @access  Protected, Write access required
 */
router.patch("/:subtaskId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.updateSubtaskStatusSchema), (0, asyncHandler_1.asyncHandler)(SubtaskController_1.SubtaskController.updateSubtask));
/**
 * @route   DELETE /api/households/:householdId/chores/:choreId/subtasks/:subtaskId
 * @desc    Delete a specific subtask from a chore
 * @access  Protected, Admin access required
 */
router.delete("/:subtaskId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(SubtaskController_1.SubtaskController.deleteSubtask));
exports.default = router;
