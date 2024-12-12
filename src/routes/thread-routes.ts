import { Router } from 'express';
import { ThreadController } from '../controllers/ThreadController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createThreadSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/threads
 * @desc    Get threads for a household
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(ThreadController.getThreads));

/**
 * @route   POST /api/households/:householdId/threads
 * @desc    Create a new thread within a household
 * @access  Protected
 */
router.post(
  '/',
  authMiddleware,
  validate(createThreadSchema),
  asyncHandler(ThreadController.createThread)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId
 * @desc    Retrieve details of a specific thread
 * @access  Protected
 */
router.get(
  '/:threadId',
  authMiddleware,
  asyncHandler(ThreadController.getThreadById)
);

/**
 * @route   PATCH /api/households/:householdId/threads/:threadId
 * @desc    Update an existing thread
 * @access  Protected, Admin or Thread Owner
 */
router.patch(
  '/:threadId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(ThreadController.updateThread)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId
 * @desc    Delete a thread from a household
 * @access  Protected, Admin only
 */
router.delete(
  '/:threadId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(ThreadController.deleteThread)
);

/**
 * @route   POST /api/households/:householdId/threads/:threadId/invite
 * @desc    Invite users to a thread
 * @access  Protected, Admin or Thread Owner
 */
router.post(
  '/:threadId/invite',
  authMiddleware,
  asyncHandler(ThreadController.inviteUsersToThread)
);

export default router;
