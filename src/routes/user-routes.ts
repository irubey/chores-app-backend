import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { registerUserSchema, loginUserSchema, createHouseholdSchema, addMemberSchema, updateHouseholdSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerUserSchema), asyncHandler(UserController.register));

/**
 * @route   POST /api/users/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', validate(loginUserSchema), asyncHandler(UserController.login));

/**
 * @route   GET /api/users/profile
 * @desc    Get the authenticated user's profile
 * @access  Protected
 */
router.get('/profile', authMiddleware, asyncHandler(UserController.getProfile));

/**
 * @route   POST /api/households
 * @desc    Create a new household
 * @access  Protected
 */
router.post(
  '/households',
  authMiddleware,
  validate(createHouseholdSchema),
  asyncHandler(UserController.createHousehold)
);

/**
 * @route   PATCH /api/households/:householdId
 * @desc    Update household details
 * @access  Protected, Admin only
 */
router.patch(
  '/households/:householdId',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  validate(updateHouseholdSchema),
  asyncHandler(UserController.updateHousehold)
);

/**
 * @route   POST /api/households/:householdId/members
 * @desc    Add a new member to a household
 * @access  Protected, Admin only
 */
router.post(
  '/households/:householdId/members',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  validate(addMemberSchema),
  asyncHandler(UserController.addMember)
);

/**
 * @route   DELETE /api/households/:householdId/members/:memberId
 * @desc    Remove a member from a household
 * @access  Protected, Admin only
 */
router.delete(
  '/households/:householdId/members/:memberId',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  asyncHandler(UserController.removeMember)
);

/**
 * @route   DELETE /api/households/:householdId
 * @desc    Delete a household
 * @access  Protected, Admin only
 */
router.delete(
  '/households/:householdId',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  asyncHandler(UserController.deleteHousehold)
);

export default router;