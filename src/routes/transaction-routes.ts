import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createTransactionSchema,
  updateTransactionStatusSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/transactions
 * @desc    Retrieve all transactions for a specific household
 * @access  Protected
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(TransactionController.getTransactions)
);

/**
 * @route   POST /api/households/:householdId/transactions
 * @desc    Create a new transaction within a household
 * @access  Protected, Write access required
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('WRITE'),
  validate(createTransactionSchema),
  asyncHandler(TransactionController.createTransaction)
);

/**
 * @route   PATCH /api/households/:householdId/transactions/:transactionId
 * @desc    Update the status of a specific transaction
 * @access  Protected, Write access required
 */
router.patch(
  '/:transactionId',
  authMiddleware,
  rbacMiddleware('WRITE'),
  validate(updateTransactionStatusSchema),
  asyncHandler(TransactionController.updateTransactionStatus)
);

/**
 * @route   DELETE /api/households/:householdId/transactions/:transactionId
 * @desc    Delete a transaction from a household
 * @access  Protected, Admin access required
 */
router.delete(
  '/:transactionId',
  authMiddleware,
  rbacMiddleware('ADMIN'),
  asyncHandler(TransactionController.deleteTransaction)
);

export default router;
