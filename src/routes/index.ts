import { Router } from 'express';
import authRoutes from './auth-routes';
import userRoutes from './user-routes';
import householdRoutes from './household-routes';
import choreRoutes from './chore-routes';
import subtaskRoutes from './subtask-routes';
import expenseRoutes from './expense-routes';
import transactionRoutes from './transaction-routes';
import notificationRoutes from './notification-routes';
import calendarIntegrationRoutes from './calendar-integration-routes';
import calendarEventRoutes from './calendar-event-routes';
import choreEventRoutes from './chore-event-routes';
import threadRoutes from './thread-routes';

const router = Router();

/**
 * @route   /api/auth
 * @desc    Authentication routes
 */
router.use('/auth', authRoutes);

/**
 * @route   /api/users
 * @desc    User management routes
 */
router.use('/users', userRoutes);

/**
 * @route   /api/households
 * @desc    Household management routes
 */
router.use('/households', householdRoutes);

/**
 * @route   /api/households/:householdId/chores
 * @desc    Chore management routes
 */
router.use('/households/:householdId/chores', choreRoutes);

/**
 * @route   /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Subtask management routes
 */
router.use('/households/:householdId/chores/:choreId/subtasks', subtaskRoutes);

/**
 * @route   /api/households/:householdId/expenses
 * @desc    Shared finances management routes
 */
router.use('/households/:householdId/expenses', expenseRoutes);

/**
 * @route   /api/households/:householdId/transactions
 * @desc    Transaction management routes
 */
router.use('/households/:householdId/transactions', transactionRoutes);

/**
 * @route   /api/notifications
 * @desc    Notification management routes
 */
router.use('/notifications', notificationRoutes);

/**
 * @route   /api/households/:householdId/calendar
 * @desc    Calendar integration routes
 */
router.use('/households/:householdId/calendar', calendarIntegrationRoutes);

/**
 * @route   /api/households/:householdId/calendar/events
 * @desc    Calendar event routes
 */
router.use('/households/:householdId/calendar/events', calendarEventRoutes);

/**
 * @route   /api/households/:householdId/chores/:choreId/events
 * @desc    Chore event routes
 */
router.use('/households/:householdId/chores/:choreId/events', choreEventRoutes);

/**
 * @route   /api/households/:householdId/threads
 * @desc    Thread management routes
 */
router.use('/households/:householdId/threads', threadRoutes);

export default router;
