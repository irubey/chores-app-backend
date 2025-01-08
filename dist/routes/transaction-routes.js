"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransactionController_1 = require("../controllers/TransactionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/transactions
 * @desc    Retrieve all transactions for a specific household
 * @access  Protected
 */
router.get("/", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(TransactionController_1.TransactionController.getTransactions));
/**
 * @route   POST /api/households/:householdId/transactions
 * @desc    Create a new transaction within a household
 * @access  Protected, Write access required
 */
router.post("/", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.createTransactionSchema), (0, asyncHandler_1.asyncHandler)(TransactionController_1.TransactionController.createTransaction));
/**
 * @route   PATCH /api/households/:householdId/transactions/:transactionId
 * @desc    Update the status of a specific transaction
 * @access  Protected, Write access required
 */
router.patch("/:transactionId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, validationMiddleware_1.validate)(validationSchemas_1.updateTransactionStatusSchema), (0, asyncHandler_1.asyncHandler)(TransactionController_1.TransactionController.updateTransactionStatus));
/**
 * @route   DELETE /api/households/:householdId/transactions/:transactionId
 * @desc    Delete a transaction from a household
 * @access  Protected, Admin access required
 */
router.delete("/:transactionId", authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(TransactionController_1.TransactionController.deleteTransaction));
exports.default = router;
