import { Router } from 'express';
import { CalendarIntegrationController } from '../controllers/CalendarIntegrationController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createEventSchema, updateEventSchema, } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/calendar
 * @desc    Retrieve all calendar events for a specific household
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(CalendarIntegrationController.getCalendarEvents));
/**
 * @route   POST /api/households/:householdId/calendar
 * @desc    Create a new calendar event within a household
 * @access  Protected, Admin only
 */
router.post('/', authMiddleware, rbacMiddleware(['ADMIN']), validate(createEventSchema), asyncHandler(CalendarIntegrationController.createEvent));
/**
 * @route   PATCH /api/households/:householdId/calendar/:eventId
 * @desc    Update an existing calendar event
 * @access  Protected, Admin only
 */
router.patch('/:eventId', authMiddleware, rbacMiddleware(['ADMIN']), validate(updateEventSchema), asyncHandler(CalendarIntegrationController.updateEvent));
/**
 * @route   DELETE /api/households/:householdId/calendar/:eventId
 * @desc    Delete a calendar event from a household
 * @access  Protected, Admin only
 */
router.delete('/:eventId', authMiddleware, rbacMiddleware(['ADMIN']), asyncHandler(CalendarIntegrationController.deleteEvent));
/**
 * @route   POST /api/households/:householdId/calendar/sync
 * @desc    Sync household calendar with a user's personal calendar
 * @access  Protected
 */
router.post('/sync', authMiddleware, asyncHandler(CalendarIntegrationController.syncWithPersonalCalendar));
export default router;
