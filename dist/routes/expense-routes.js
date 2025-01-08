"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ExpenseController_1 = require("../controllers/ExpenseController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const multer_1 = __importDefault(require("multer"));
// Configure Multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/receipts/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/expenses
 * @desc    Retrieve all expenses for a specific household
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.getExpenses));
/**
 * @route   POST /api/households/:householdId/expenses
 * @desc    Create a new expense within a household
 * @access  Protected, Write access required
 */
router.post("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.createExpenseSchema), (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.createExpense));
/**
 * @route   GET /api/households/:householdId/expenses/:expenseId
 * @desc    Retrieve details of a specific expense
 * @access  Protected
 */
router.get("/:expenseId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.getExpenseDetails));
/**
 * @route   PATCH /api/households/:householdId/expenses/:expenseId
 * @desc    Update an existing expense
 * @access  Protected, Write access required
 */
router.patch("/:expenseId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.updateExpenseSchema), (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.updateExpense));
/**
 * @route   DELETE /api/households/:householdId/expenses/:expenseId
 * @desc    Delete an expense from a household
 * @access  Protected, Admin access required
 */
router.delete("/:expenseId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.deleteExpense));
/**
 * @route   POST /api/households/:householdId/expenses/:expenseId/receipts
 * @desc    Upload a receipt for a specific expense
 * @access  Protected, Write access required
 */
router.post("/:expenseId/receipts", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), upload.single("file"), // 'file' should match the form-data key
(0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.uploadReceipt));
/**
 * @route   GET /api/households/:householdId/expenses/:expenseId/receipts
 * @desc    Retreive all receipts for a household
 * @access  Protected
 */
router.get("/:expenseId/receipts", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.getReceipts));
/**
 * @route   GET /api/households/:householdId/expenses/:expenseId/receipts/:receiptId
 * @desc    Retrieve a receipt by ID
 * @access  Protected
 */
router.get("/:expenseId/receipts/:receiptId", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.getReceiptById));
/**
 * @route   DELETE /api/households/:householdId/expenses/:expenseId/receipts/:receiptId
 * @desc    Delete a receipt by ID
 * @access  Protected, Admin access required
 */
router.delete("/:expenseId/receipts/:receiptId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.deleteReceipt));
/**
 * @route   PATCH /api/households/:householdId/expenses/:expenseId/splits
 * @desc    Update the splits for an expense
 * @access  Protected, Write access required
 */
router.patch("/:expenseId/splits", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(ExpenseController_1.ExpenseController.updateExpenseSplits));
exports.default = router;
