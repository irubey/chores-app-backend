import { Router } from 'express';
import { CalendarEventController } from '../controllers/CalendarEventController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/calendar/events
 * @desc    Retrieve all general calendar events for a household
 * @access  Protected
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(CalendarEventController.getCalendarEvents)
);

/**
 * @route   POST /api/households/:householdId/calendar/events
 * @desc    Create a new general calendar event
 * @access  Protected, Write access required
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(CalendarEventController.createCalendarEvent)
);

/**
 * @route   GET /api/households/:householdId/calendar/events/:eventId
 * @desc    Retrieve details of a specific general calendar event
 * @access  Protected
 */
router.get(
  '/:eventId',
  authMiddleware,
  asyncHandler(CalendarEventController.getEventById)
);

/**
 * @route   PATCH /api/households/:householdId/calendar/events/:eventId
 * @desc    Update an existing general calendar event
 * @access  Protected, Write access required
 */
router.patch(
  '/:eventId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(CalendarEventController.updateEvent)
);

/**
 * @route   DELETE /api/households/:householdId/calendar/events/:eventId
 * @desc    Delete a general calendar event
 * @access  Protected, Admin access required
 */
router.delete(
  '/:eventId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(CalendarEventController.deleteEvent)
);

/**
 * @route   POST /api/households/:householdId/calendar/events/:eventId/reminders
 * @desc    Add a reminder to a calendar event
 * @access  Protected, Write access required
 */
router.post(
  '/:eventId/reminders',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(CalendarEventController.addReminder)
);

/**
 * @route   DELETE /api/households/:householdId/calendar/events/:eventId/reminders/:reminderId
 * @desc    Remove a reminder from a calendar event
 * @access  Protected, Write access required
 */
router.delete(
  '/:eventId/reminders/:reminderId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(CalendarEventController.removeReminder)
);

/**
 * @route   GET /api/households/:householdId/calendar/events/date/:date
 * @desc    Get events for a specific date
 * @access  Protected
 */
router.get(
  '/date/:date',
  authMiddleware,
  asyncHandler(CalendarEventController.getEventsByDate)
);

export default router;
