import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validate } from "../middlewares/validationMiddleware";
import {
  registerUserSchema,
  loginUserSchema,
} from "../utils/validationSchemas";
import { asyncHandler } from "../utils/asyncHandler";
import authMiddleware from "../middlewares/authMiddleware";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again later",
});

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/register",
  validate(registerUserSchema),
  asyncHandler(AuthController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set cookies
 * @access  Public
 */
router.post(
  "/login",
  authLimiter,
  validate(loginUserSchema),
  asyncHandler(AuthController.login)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear auth cookies
 * @access  Protected
 */
router.post("/logout", authMiddleware, asyncHandler(AuthController.logout));

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token from cookies
 * @access  Public
 */
router.post("/refresh-token", asyncHandler(AuthController.refreshToken));

export default router;
