"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ThreadController_1 = require("../controllers/ThreadController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const message_routes_1 = __importDefault(require("./message-routes"));
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/threads
 * @desc    Get threads for a household
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ThreadController_1.ThreadController.getThreads));
/**
 * @route   POST /api/households/:householdId/threads
 * @desc    Create a new thread within a household
 * @access  Protected
 */
router.post("/", authMiddleware_1.authMiddleware, (0, validationMiddleware_1.validate)(validationSchemas_1.createThreadSchema), (0, asyncHandler_1.asyncHandler)(ThreadController_1.ThreadController.createThread));
/**
 * @route   GET /api/households/:householdId/threads/:threadId
 * @desc    Retrieve details of a specific thread
 * @access  Protected
 */
router.get("/:threadId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ThreadController_1.ThreadController.getThreadById));
/**
 * @route   PATCH /api/households/:householdId/threads/:threadId
 * @desc    Update an existing thread
 * @access  Protected, Admin or Thread Owner
 */
router.patch("/:threadId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(ThreadController_1.ThreadController.updateThread));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId
 * @desc    Delete a thread from a household
 * @access  Protected, Admin only
 */
router.delete("/:threadId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(ThreadController_1.ThreadController.deleteThread));
/**
 * @route   POST /api/households/:householdId/threads/:threadId/invite
 * @desc    Invite users to a thread
 * @access  Protected, Admin or Thread Owner
 */
router.post("/:threadId/invite", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ThreadController_1.ThreadController.inviteUsersToThread));
// Mount message routes under threads
router.use("/:threadId/messages", message_routes_1.default);
exports.default = router;
