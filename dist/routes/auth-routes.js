import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validationMiddleware';
import { registerUserSchema, loginUserSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerUserSchema), asyncHandler(AuthController.register));
/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 */
router.post('/login', validate(loginUserSchema), asyncHandler(AuthController.login));
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Protected
 */
router.post('/logout', asyncHandler(AuthController.logout));
/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', asyncHandler(AuthController.refreshToken));
export default router;
