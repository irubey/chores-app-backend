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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transactionService = __importStar(require("../services/transactionService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * TransactionController handles all CRUD operations related to transactions.
 */
class TransactionController {
    /**
     * Retrieves all transactions for a specific household.
     */
    static async getTransactions(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId } = req.params;
            if (!householdId) {
                throw new errorHandler_1.BadRequestError("Household ID is required");
            }
            const response = await transactionService.getTransactions(householdId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new transaction within a household.
     */
    static async createTransaction(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId } = req.params;
            if (!householdId) {
                throw new errorHandler_1.BadRequestError("Household ID is required");
            }
            const transactionData = {
                expenseId: req.body.expenseId,
                fromUserId: req.body.fromUserId,
                toUserId: req.body.toUserId,
                amount: req.body.amount,
                status: req.body.status,
            };
            const response = await transactionService.createTransaction(householdId, transactionData, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates the status of a specific transaction.
     */
    static async updateTransactionStatus(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, transactionId } = req.params;
            if (!householdId || !transactionId) {
                throw new errorHandler_1.BadRequestError("Household ID and Transaction ID are required");
            }
            const updateData = {
                status: req.body.status,
            };
            const response = await transactionService.updateTransactionStatus(householdId, transactionId, updateData, req.user.id);
            if (!response) {
                throw new errorHandler_1.NotFoundError("Transaction not found or you do not have permission to update it");
            }
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a transaction from a household.
     */
    static async deleteTransaction(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, transactionId } = req.params;
            if (!householdId || !transactionId) {
                throw new errorHandler_1.BadRequestError("Household ID and Transaction ID are required");
            }
            await transactionService.deleteTransaction(householdId, transactionId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
