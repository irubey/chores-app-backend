"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased from 5 to 100 attempts
    message: "Too many requests, please try again later.",
});
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", (0, validationMiddleware_1.validate)(validationSchemas_1.registerUserSchema), (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await authController_1.AuthController.register(req, res, next);
}));
/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set cookies
 * @access  Public
 */
router.post("/login", authLimiter, (0, validationMiddleware_1.validate)(validationSchemas_1.loginUserSchema), (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await authController_1.AuthController.login(req, res, next);
}));
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear auth cookies
 * @access  Protected
 */
router.post("/logout", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(authController_1.AuthController.logout));
/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token from cookies
 * @access  Public
 */
router.post("/refresh-token", (0, asyncHandler_1.asyncHandler)(authController_1.AuthController.refreshToken));
exports.default = router;
