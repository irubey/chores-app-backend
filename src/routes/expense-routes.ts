import { Router } from 'express';
import { ExpenseController } from '../controllers/ExpenseController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
import multer from 'multer';

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/receipts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

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
router.get(
  '/:expenseId',
  authMiddleware,
  asyncHandler(ExpenseController.getExpenseDetails)
);

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

/**
 * @route   POST /api/households/:householdId/expenses/:expenseId/receipts
 * @desc    Upload a receipt for a specific expense
 * @access  Protected
 */
router.post(
  '/:expenseId/receipts',
  authMiddleware,
  upload.single('file'), // 'file' should match the form-data key
  asyncHandler(ExpenseController.uploadReceipt)
);

/**
 * @route   GET /api/households/:householdId/expenses/:expenseId/receipts
 * @desc    Retreive all receipts for a household
 * @access  Protected
 */
router.get(
  '/:expenseId/receipts',
  authMiddleware,
  asyncHandler(ExpenseController.getReceipts)
);

/**
 * @route   GET /api/households/:householdId/expenses/:expenseId/receipts/:receiptId
 * @desc    Retrieve a receipt by ID
 * @access  Protected
 */
router.get(
  '/:expenseId/receipts/:receiptId',
  authMiddleware,
  asyncHandler(ExpenseController.getReceiptById)
);

/**
 * @route   DELETE /api/households/:householdId/expenses/:expenseId/receipts/:receiptId
 * @desc    Delete a receipt by ID
 * @access  Protected
 */
router.delete(
  '/:expenseId/receipts/:receiptId',
  authMiddleware,
  asyncHandler(ExpenseController.deleteReceipt)
);

/**
 * @route   PATCH /api/households/:householdId/expenses/:expenseId/splits
 * @desc    Update the splits for an expense
 * @access  Protected, Write access required
 */
router.patch(
  '/:expenseId/splits',
  authMiddleware,
  rbacMiddleware('WRITE'),
  asyncHandler(ExpenseController.updateExpenseSplits)
);

export default router;
