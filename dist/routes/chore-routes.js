"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const choreController_1 = require("../controllers/choreController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/chores
 * @desc    Retrieve all chores for a specific household
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.getChores));
/**
 * @route   POST /api/households/:householdId/chores
 * @desc    Create a new chore within a household
 * @access  Protected, Admin only
 */
router.post("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, validationMiddleware_1.validate)(validationSchemas_1.createChoreSchema), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.createChore));
/**
 * @route   GET /api/households/:householdId/chores/:choreId
 * @desc    Retrieve details of a specific chore
 * @access  Protected
 */
router.get("/:choreId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.getChoreDetails));
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId
 * @desc    Update an existing chore
 * @access  Protected, Write access required
 */
router.patch("/:choreId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.updateChoreSchema), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.updateChore));
/**
 * @route   DELETE /api/households/:householdId/chores/:choreId
 * @desc    Delete a chore from a household
 * @access  Protected, Admin only
 */
router.delete("/:choreId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.deleteChore));
/**
 * @route   POST /api/households/:householdId/chores/:choreId/swap-request
 * @desc    Request a chore swap
 * @access  Protected, Write access required
 */
router.post("/:choreId/swap-request", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.createChoreSwapRequest));
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId/swap-approve
 * @desc    Approve a chore swap request
 * @access  Protected, Write access required
 */
router.patch("/:choreId/swap-approve", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(choreController_1.ChoreController.approveOrRejectChoreSwap));
exports.default = router;
