import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validationMiddleware';
import { registerUserSchema, loginUserSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(registerUserSchema),
  asyncHandler(AuthController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set cookies
 * @access  Public
 */
router.post(
  '/login',
  validate(loginUserSchema),
  asyncHandler(AuthController.login)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear auth cookies
 * @access  Protected
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(AuthController.logout)
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token from cookies
 * @access  Public
 */
router.post(
  '/refresh-token',
  asyncHandler(AuthController.refreshToken)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Protected
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(AuthController.getCurrentUser)
);

export default router;