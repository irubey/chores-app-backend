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
 * @access  Protected, Admin only
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
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
 * @access  Protected, Admin only
 */
router.patch(
  '/:eventId',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  validate(updateEventSchema),
  asyncHandler(EventController.updateEvent)
);

/**
 * @route   DELETE /api/households/:householdId/events/:eventId
 * @desc    Delete an event from a household
 * @access  Protected, Admin only
 */
router.delete(
  '/:eventId',
  authMiddleware,
  rbacMiddleware(['ADMIN']),
  asyncHandler(EventController.deleteEvent)
);

export default router;