import { Router } from 'express';
import { HouseholdController } from '../controllers/HouseholdController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createHouseholdSchema,
  updateHouseholdSchema,
  addMemberSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @route   POST /api/households
 * @desc    Create a new household
 * @access  Protected
 */
router.post(
  '/',
  authMiddleware,
  validate(createHouseholdSchema),
  asyncHandler(HouseholdController.createHousehold)
);

/**
 * @route   GET /api/households/:householdId
 * @desc    Retrieve details of a specific household
 * @access  Protected
 */
router.get(
  '/:householdId',
  authMiddleware,
  asyncHandler(HouseholdController.getHousehold)
);

/**
 * @route   PATCH /api/households/:householdId
 * @desc    Update an existing household
 * @access  Protected, Admin access required
 */
router.patch(
  '/:householdId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  validate(updateHouseholdSchema),
  asyncHandler(HouseholdController.updateHousehold)
);

/**
 * @route   DELETE /api/households/:householdId
 * @desc    Delete a household
 * @access  Protected, Admin access required
 */
router.delete(
  '/:householdId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(HouseholdController.deleteHousehold)
);

/**
 * @route   POST /api/households/:householdId/members
 * @desc    Add a new member to the household
 * @access  Protected, Admin access required
 */
router.post(
  '/:householdId/members',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  validate(addMemberSchema),
  asyncHandler(HouseholdController.addMember)
);

/**
 * @route   DELETE /api/households/:householdId/members/:memberId
 * @desc    Remove a member from the household
 * @access  Protected, Admin access required
 */
router.delete(
  '/:householdId/members/:memberId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(HouseholdController.removeMember)
);

/**
 * @route   PATCH /api/households/:householdId/members/:memberId/status
 * @desc    Update the status of a household member (e.g., accept invitation)
 * @access  Protected
 */
router.patch(
  '/:householdId/members/:memberId/status',
  authMiddleware,
  asyncHandler(HouseholdController.updateMemberStatus)
);

/**
 * @route   GET /api/households/selected
 * @desc    Retrieve all households selected by the user
 * @access  Protected
 */
router.get(
  '/selected',
  authMiddleware,
  asyncHandler(HouseholdController.getSelectedHouseholds)
);

/**
 * @route   PATCH /api/households/:householdId/members/:memberId/selection
 * @desc    Toggle the selection state of a household for a member
 * @access  Protected
 */
router.patch(
  '/:householdId/members/:memberId/selection',
  authMiddleware,
  asyncHandler(HouseholdController.toggleHouseholdSelection)
);

export default router;