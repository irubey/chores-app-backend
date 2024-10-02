import { Router } from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import authMiddleware from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createExpenseSchema, updateExpenseSchema } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/expenses
 * @desc    Retrieve all expenses for a specific household
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(ExpenseController.getExpenses));

/**
 * @route   POST /api/households/:householdId/expenses
 * @desc    Create a new expense within a household
 * @access  Protected, Write access required
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('WRITE'),
  validate(createExpenseSchema),
  asyncHandler(ExpenseController.createExpense)
);

/**
 * @route   GET /api/households/:householdId/expenses/:expenseId
 * @desc    Retrieve details of a specific expense
 * @access  Protected
 */
router.get('/:expenseId', authMiddleware, asyncHandler(ExpenseController.getExpenseDetails));

/**
 * @route   PATCH /api/households/:householdId/expenses/:expenseId
 * @desc    Update an existing expense
 * @access  Protected, Write access required
 */
router.patch(
  '/:expenseId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  validate(updateExpenseSchema),
  asyncHandler(ExpenseController.updateExpense)
);

/**
 * @route   DELETE /api/households/:householdId/expenses/:expenseId
 * @desc    Delete an expense from a household
 * @access  Protected, Admin access required
 */
router.delete(
  '/:expenseId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(ExpenseController.deleteExpense)
);

export default router;