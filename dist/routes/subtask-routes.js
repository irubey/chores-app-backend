import { Router } from 'express';
import { SubtaskController } from '../controllers/SubtaskController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createSubtaskSchema, updateSubtaskStatusSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router({ mergeParams: true });
/**
 * @route   POST /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Add a new subtask to a specific chore
 * @access  Protected, Admin only
 */
router.post('/:choreId/subtasks', authMiddleware, rbacMiddleware(['ADMIN']), validate(createSubtaskSchema), asyncHandler(SubtaskController.addSubtask));
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId/subtasks/:subtaskId
 * @desc    Update the status of a specific subtask
 * @access  Protected, Admin only
 */
router.patch('/:choreId/subtasks/:subtaskId', authMiddleware, rbacMiddleware(['ADMIN']), validate(updateSubtaskStatusSchema), asyncHandler(SubtaskController.updateSubtaskStatus));
/**
 * @route   DELETE /api/households/:householdId/chores/:choreId/subtasks/:subtaskId
 * @desc    Delete a specific subtask from a chore
 * @access  Protected, Admin only
 */
router.delete('/:choreId/subtasks/:subtaskId', authMiddleware, rbacMiddleware(['ADMIN']), asyncHandler(SubtaskController.deleteSubtask));
export default router;
