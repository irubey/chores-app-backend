import { Router } from 'express';
import { ChoreController } from '../controllers/ChoreController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createChoreSchema, updateChoreSchema, createSubtaskSchema, updateSubtaskStatusSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/chores
 * @desc    Retrieve all chores for a specific household
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(ChoreController.getChores));
/**
 * @route   POST /api/households/:householdId/chores
 * @desc    Create a new chore within a household
 * @access  Protected, Admin only
 */
router.post('/', authMiddleware, rbacMiddleware(['ADMIN']), validate(createChoreSchema), asyncHandler(ChoreController.createChore));
/**
 * @route   GET /api/households/:householdId/chores/:choreId
 * @desc    Retrieve details of a specific chore
 * @access  Protected
 */
router.get('/:choreId', authMiddleware, asyncHandler(ChoreController.getChoreDetails));
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId
 * @desc    Update an existing chore
 * @access  Protected, Admin only
 */
router.patch('/:choreId', authMiddleware, rbacMiddleware(['ADMIN']), validate(updateChoreSchema), asyncHandler(ChoreController.updateChore));
/**
 * @route   DELETE /api/households/:householdId/chores/:choreId
 * @desc    Delete a chore from a household
 * @access  Protected, Admin only
 */
router.delete('/:choreId', authMiddleware, rbacMiddleware(['ADMIN']), asyncHandler(ChoreController.deleteChore));
// Add Subtask Routes
router.post('/:choreId/subtasks', authMiddleware, rbacMiddleware(['ADMIN']), validate(createSubtaskSchema), asyncHandler(ChoreController.addSubtask));
router.patch('/:choreId/subtasks/:subtaskId', authMiddleware, rbacMiddleware(['ADMIN']), validate(updateSubtaskStatusSchema), asyncHandler(ChoreController.updateSubtaskStatus));
router.delete('/:choreId/subtasks/:subtaskId', authMiddleware, rbacMiddleware(['ADMIN']), asyncHandler(ChoreController.deleteSubtask));
export default router;
