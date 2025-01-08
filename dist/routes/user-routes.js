"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/users/profile
 * @desc    Get the authenticated user's profile
 * @access  Protected
 */
router.get("/profile", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(userController_1.UserController.getProfile));
/**
 * @route   PATCH /api/users/profile
 * @desc    Update the authenticated user's profile
 * @access  Protected
 */
router.patch("/profile", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(userController_1.UserController.updateProfile));
exports.default = router;
