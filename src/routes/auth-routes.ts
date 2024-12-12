import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validationMiddleware';
import {
  registerUserSchema,
  loginUserSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/authMiddleware';
import rateLimit from 'express-rate-limit';
import { RegisterUserDTO, LoginCredentials } from '@shared/types';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 5 to 100 attempts
  message: 'Too many requests, please try again later.',
});

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(registerUserSchema),
  asyncHandler<RegisterUserDTO>(async (req, res, next) => {
    await AuthController.register(req, res, next);
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set cookies
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginUserSchema),
  asyncHandler<LoginCredentials>(async (req, res, next) => {
    await AuthController.login(req, res, next);
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear auth cookies
 * @access  Protected
 */
router.post('/logout', authMiddleware, asyncHandler(AuthController.logout));

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token from cookies
 * @access  Public
 */
router.post('/refresh-token', asyncHandler(AuthController.refreshToken));

export default router;
