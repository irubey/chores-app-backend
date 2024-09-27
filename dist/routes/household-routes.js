import { Router } from 'express';
import { HouseholdController } from '../controllers/HouseholdController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createHouseholdSchema, updateHouseholdSchema, addMemberSchema, } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router();
/**
 * @route   POST /api/households
 * @desc    Create a new household
 * @access  Protected
 */
router.post('/', authMiddleware, validate(createHouseholdSchema), asyncHandler(HouseholdController.createHousehold));
/**
 * @route   GET /api/households/:householdId
 * @desc    Retrieve details of a specific household
 * @access  Protected
 */
router.get('/:householdId', authMiddleware, asyncHandler(HouseholdController.getHousehold));
/**
 * @route   PATCH /api/households/:householdId
 * @desc    Update an existing household
 * @access  Protected, Admin only
 */
router.patch('/:householdId', authMiddleware, rbacMiddleware(['ADMIN']), validate(updateHouseholdSchema), asyncHandler(HouseholdController.updateHousehold));
/**
 * @route   DELETE /api/households/:householdId
 * @desc    Delete a household
 * @access  Protected, Admin only
 */
router.delete('/:householdId', authMiddleware, rbacMiddleware(['ADMIN']), asyncHandler(HouseholdController.deleteHousehold));
/**
 * @route   POST /api/households/:householdId/members
 * @desc    Add a new member to the household
 * @access  Protected, Admin only
 */
router.post('/:householdId/members', authMiddleware, rbacMiddleware(['ADMIN']), validate(addMemberSchema), asyncHandler(HouseholdController.addMember));
/**
 * @route   DELETE /api/households/:householdId/members/:memberId
 * @desc    Remove a member from the household
 * @access  Protected, Admin only
 */
router.delete('/:householdId/members/:memberId', authMiddleware, rbacMiddleware(['ADMIN']), asyncHandler(HouseholdController.removeMember));
export default router;
