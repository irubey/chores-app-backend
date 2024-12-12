import { Router } from 'express';
import { CalendarIntegrationController } from '../controllers/CalendarIntegrationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { syncCalendarSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   POST /api/households/:householdId/calendar/sync
 * @desc    Sync household calendar with a user's personal calendar
 * @access  Protected
 */
router.post(
  '/sync',
  authMiddleware,
  validate(syncCalendarSchema),
  asyncHandler(CalendarIntegrationController.syncWithPersonalCalendar)
);

export default router;
