"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseController = void 0;
const expenseService = __importStar(require("../services/expenseService"));
const errorHandler_1 = require("../middlewares/errorHandler");
const path_1 = __importDefault(require("path"));
/**
 * ExpenseController handles all CRUD operations related to expenses.
 */
class ExpenseController {
    /**
     * Retrieves all expenses for a specific household.
     */
    static async getExpenses(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId } = req.params;
            if (!householdId) {
                throw new errorHandler_1.BadRequestError("Household ID is required");
            }
            const response = await expenseService.getExpenses(householdId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new expense within a household.
     */
    static async createExpense(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId } = req.params;
            if (!householdId) {
                throw new errorHandler_1.BadRequestError("Household ID is required");
            }
            const expenseData = req.body;
            const response = await expenseService.createExpense(householdId, expenseData, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific expense.
     */
    static async getExpenseDetails(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId } = req.params;
            if (!householdId || !expenseId) {
                throw new errorHandler_1.BadRequestError("Household ID and Expense ID are required");
            }
            const response = await expenseService.getExpenseById(householdId, expenseId, req.user.id);
            if (!response) {
                throw new errorHandler_1.NotFoundError("Expense not found");
            }
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing expense.
     */
    static async updateExpense(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId } = req.params;
            if (!householdId || !expenseId) {
                throw new errorHandler_1.BadRequestError("Household ID and Expense ID are required");
            }
            const updateData = req.body;
            const response = await expenseService.updateExpense(householdId, expenseId, updateData, req.user.id);
            if (!response) {
                throw new errorHandler_1.NotFoundError("Expense not found or you do not have permission to update it");
            }
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes an expense from a household.
     */
    static async deleteExpense(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId } = req.params;
            if (!householdId || !expenseId) {
                throw new errorHandler_1.BadRequestError("Household ID and Expense ID are required");
            }
            await expenseService.deleteExpense(householdId, expenseId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Uploads a receipt file for a specific expense.
     */
    static async uploadReceipt(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId } = req.params;
            if (!householdId || !expenseId) {
                throw new errorHandler_1.BadRequestError("Household ID and Expense ID are required");
            }
            if (!req.file) {
                throw new errorHandler_1.BadRequestError("No file uploaded");
            }
            const filePath = path_1.default.join("uploads/receipts/", req.file.filename);
            const fileType = req.file.mimetype;
            const response = await expenseService.uploadReceipt(householdId, expenseId, req.user.id, {
                url: filePath,
                fileType: fileType,
                expenseId: expenseId,
            });
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves all receipts for a specific expense.
     */
    static async getReceipts(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId } = req.params;
            if (!householdId || !expenseId) {
                throw new errorHandler_1.BadRequestError("Household ID and Expense ID are required");
            }
            const response = await expenseService.getReceipts(householdId, expenseId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves a specific receipt by ID.
     */
    static async getReceiptById(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId, receiptId } = req.params;
            if (!householdId || !expenseId || !receiptId) {
                throw new errorHandler_1.BadRequestError("Household ID, Expense ID, and Receipt ID are required");
            }
            const response = await expenseService.getReceiptById(householdId, expenseId, receiptId, req.user.id);
            if (!response) {
                throw new errorHandler_1.NotFoundError("Receipt not found");
            }
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a specific receipt by ID.
     */
    static async deleteReceipt(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId, receiptId } = req.params;
            if (!householdId || !expenseId || !receiptId) {
                throw new errorHandler_1.BadRequestError("Household ID, Expense ID, and Receipt ID are required");
            }
            await expenseService.deleteReceipt(householdId, expenseId, receiptId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates the splits for an expense.
     */
    static async updateExpenseSplits(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, expenseId } = req.params;
            if (!householdId || !expenseId) {
                throw new errorHandler_1.BadRequestError("Household ID and Expense ID are required");
            }
            const splits = req.body.splits;
            if (!splits || !Array.isArray(splits)) {
                throw new errorHandler_1.BadRequestError("Valid splits array is required");
            }
            const response = await expenseService.updateExpenseSplits(householdId, expenseId, splits, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpenseController = ExpenseController;
