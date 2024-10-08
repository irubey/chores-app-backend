import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createEventSchema, updateEventSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/events
 * @desc    Retrieve all events for a specific household
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(EventController.getEvents));

/**
 * @route   POST /api/households/:householdId/events
 * @desc    Create a new event within a household
 * @access  Protected, Write access required
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('WRITE'),
  validate(createEventSchema),
  asyncHandler(EventController.createEvent)
);

/**
 * @route   GET /api/households/:householdId/events/:eventId
 * @desc    Retrieve details of a specific event
 * @access  Protected
 */
router.get('/:eventId', authMiddleware, asyncHandler(EventController.getEventDetails));

/**
 * @route   PATCH /api/households/:householdId/events/:eventId
 * @desc    Update an existing event
 * @access  Protected, Write access required
 */
router.patch(
  '/:eventId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  validate(updateEventSchema),
  asyncHandler(EventController.updateEvent)
);

/**
 * @route   DELETE /api/households/:householdId/events/:eventId
 * @desc    Delete an event from a household
 * @access  Protected, Admin access required
 */
router.delete(
  '/:eventId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(EventController.deleteEvent)
);

/**
 * @route   PATCH /api/households/:householdId/events/:eventId/status
 * @desc    Update the status of an event
 * @access  Protected, Write access required
 */
router.patch(
  '/:eventId/status',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(EventController.updateEventStatus)
);

export default router;