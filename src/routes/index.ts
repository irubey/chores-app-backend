import { Router } from 'express';
import authRoutes from './auth-routes';
import householdRoutes from './household-routes';
import choreRoutes from './chore-routes';
import expenseRoutes from './expense-routes';
import messageRoutes from './message-routes';
import eventRoutes from './event-routes';
import calendarIntegrationRoutes from './calendar-integration-routes';
import notificationRoutes from './notification-routes';
import subtaskRoutes from './subtask-routes';
import transactionRoutes from './transaction-routes';
import userRoutes from './user-routes';

const router = Router();

/**
 * @route   /api/auth
 * @desc    Authentication routes
 */
router.use('/auth', authRoutes);

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
 * @route   /api/households/:householdId/expenses
 * @desc    Shared finances management routes
 */
router.use('/households/:householdId/expenses', expenseRoutes);

/**
 * @route   /api/households/:householdId/messages
 * @desc    Messaging and collaboration routes
 */
router.use('/households/:householdId/messages', messageRoutes);

/**
 * @route   /api/households/:householdId/events
 * @desc    Event management routes
 */
router.use('/households/:householdId/events', eventRoutes);

/**
 * @route   /api/households/:householdId/calendar
 * @desc    Calendar integration routes
 */
router.use('/households/:householdId/calendar', calendarIntegrationRoutes);

/**
 * @route   /api/notifications
 * @desc    Notification management routes
 */
router.use('/notifications', notificationRoutes);

/**
 * @route   /api/households/:householdId/transactions
 * @desc    Transaction management routes
 */
router.use('/households/:householdId/transactions', transactionRoutes);

/**
 * @route   /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Subtask management routes
 */
router.use('/households/:householdId/chores/:choreId/subtasks', subtaskRoutes);

/**
 * @route   /api/users
 * @desc    User management routes
 */
router.use('/users', userRoutes);

export default router;