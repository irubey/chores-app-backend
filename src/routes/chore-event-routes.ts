import { Router } from 'express';
import { ChoreEventController } from '../controllers/ChoreEventController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/chores/:choreId/events
 * @desc    Retrieve all events linked to a specific chore
 * @access  Protected
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(ChoreEventController.getChoreEvents)
);

/**
 * @route   POST /api/households/:householdId/chores/:choreId/events
 * @desc    Create a new event linked to a chore
 * @access  Protected, Write access required
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(ChoreEventController.createChoreEvent)
);

/**
 * @route   GET /api/households/:householdId/chores/:choreId/events/:eventId
 * @desc    Retrieve details of a specific chore event
 * @access  Protected
 */
router.get(
  '/:eventId',
  authMiddleware,
  asyncHandler(ChoreEventController.getChoreEventById)
);

/**
 * @route   PATCH /api/households/:householdId/chores/:choreId/events/:eventId
 * @desc    Update an existing chore-linked event
 * @access  Protected, Write access required
 */
router.patch(
  '/:eventId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(ChoreEventController.updateChoreEvent)
);

/**
 * @route   DELETE /api/households/:householdId/chores/:choreId/events/:eventId
 * @desc    Delete a chore-linked event
 * @access  Protected, Admin access required
 */
router.delete(
  '/:eventId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(ChoreEventController.deleteChoreEvent)
);

/**
 * @route   POST /api/households/:householdId/chores/:choreId/events/:eventId/complete
 * @desc    Mark a chore event as completed
 * @access  Protected, Write access required
 */
router.post(
  '/:eventId/complete',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(ChoreEventController.updateChoreEventStatus)
);

/**
 * @route   POST /api/households/:householdId/chores/:choreId/events/:eventId/reschedule
 * @desc    Reschedule a chore event
 * @access  Protected, Write access required
 */
router.post(
  '/:eventId/reschedule',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(ChoreEventController.rescheduleChoreEvent)
);

/**
 * @route   GET /api/households/:householdId/chores/:choreId/events/upcoming
 * @desc    Get upcoming chore events
 * @access  Protected
 */
router.get(
  '/upcoming',
  authMiddleware,
  asyncHandler(ChoreEventController.getUpcomingChoreEvents)
);

export default router;
