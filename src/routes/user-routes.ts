import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  registerUserSchema,
  loginUserSchema,
  createHouseholdSchema,
  addMemberSchema,
  updateHouseholdSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get the authenticated user's profile
 * @access  Protected
 */
router.get('/profile', authMiddleware, asyncHandler(UserController.getProfile));

/**
 * @route   POST /api/users/profile
 * @desc    Update the authenticated user's profile
 * @access  Protected
 */
router.post(
  '/profile',
  authMiddleware,
  asyncHandler(UserController.updateProfile)
);

export default router;
