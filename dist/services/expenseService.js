"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenses = getExpenses;
exports.createExpense = createExpense;
exports.getExpenseById = getExpenseById;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
exports.uploadReceipt = uploadReceipt;
exports.getReceipts = getReceipts;
exports.deleteReceipt = deleteReceipt;
exports.getReceiptById = getReceiptById;
exports.updateExpenseSplits = updateExpenseSplits;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const authService_1 = require("./authService");
const expenseTransformer_1 = require("../utils/transformers/expenseTransformer");
const sockets_1 = require("../sockets");
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
// Helper function to create history record
async function createExpenseHistory(tx, expenseId, action, userId) {
    await tx.expenseHistory.create({
        data: {
            expenseId,
            action,
            changedById: userId,
        },
    });
}
/**
 * Retrieves all expenses for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of expenses.
 * @throws UnauthorizedError if the user is not a household member.
 */
async function getExpenses(householdId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const expenses = await database_1.default.expense.findMany({
        where: {
            householdId,
            deletedAt: null,
        },
        include: {
            splits: {
                include: {
                    user: true,
                },
            },
            paidBy: true,
            household: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const transformedExpenses = expenses.map((expense) => (0, expenseTransformer_1.transformExpenseWithSplits)(expense));
    return wrapResponse(transformedExpenses);
}
/**
 * Creates a new expense within a household.
 */
async function createExpense(householdId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    const expense = (await database_1.default.$transaction(async (tx) => {
        const createdExpense = await tx.expense.create({
            data: {
                householdId: data.householdId,
                amount: data.amount,
                description: data.description,
                dueDate: data.dueDate,
                category: data.category,
                paidById: data.paidById,
            },
            include: {
                household: true,
                paidBy: true,
                splits: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                profileImageURL: true,
                                createdAt: true,
                                updatedAt: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
                transactions: {
                    include: {
                        fromUser: true,
                        toUser: true,
                    },
                },
                receipts: true,
                history: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (data.splits && data.splits.length > 0) {
            await tx.expenseSplit.createMany({
                data: data.splits.map((split) => ({
                    expenseId: createdExpense.id,
                    userId: split.userId,
                    amount: split.amount,
                })),
            });
        }
        await createExpenseHistory(tx, createdExpense.id, enums_1.ExpenseAction.CREATED, userId);
        return createdExpense;
    }));
    const transformedExpense = (0, expenseTransformer_1.transformExpenseWithSplits)(expense);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('expense_created', { expense: transformedExpense });
    return wrapResponse(transformedExpense);
}
/**
 * Retrieves details of a specific expense.
 * @param householdId - The ID of the household.
 * @param expenseId - The ID of the expense.
 * @param userId - The ID of the requesting user.
 * @returns The expense details.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the expense does not exist.
 */
async function getExpenseById(householdId, expenseId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const expense = (await database_1.default.expense.findUnique({
        where: { id: expenseId },
        include: {
            household: true,
            paidBy: true,
            splits: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            profileImageURL: true,
                            createdAt: true,
                            updatedAt: true,
                            deletedAt: true,
                        },
                    },
                },
            },
            transactions: {
                include: {
                    fromUser: true,
                    toUser: true,
                },
            },
            receipts: true,
            history: {
                include: {
                    user: true,
                },
            },
        },
    }));
    if (!expense || expense.householdId !== householdId) {
        throw new errorHandler_1.NotFoundError('Expense not found in this household');
    }
    return wrapResponse((0, expenseTransformer_1.transformExpenseWithSplits)(expense));
}
/**
 * Updates an existing expense.
 */
async function updateExpense(householdId, expenseId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    const expense = (await database_1.default.$transaction(async (tx) => {
        const existingExpense = (await tx.expense.findUnique({
            where: { id: expenseId },
            include: {
                household: true,
                paidBy: true,
                splits: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                profileImageURL: true,
                                createdAt: true,
                                updatedAt: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
                transactions: {
                    include: {
                        fromUser: true,
                        toUser: true,
                    },
                },
                receipts: true,
                history: {
                    include: {
                        user: true,
                    },
                },
            },
        }));
        if (!existingExpense || existingExpense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Expense not found in this household');
        }
        const updatedExpense = await tx.expense.update({
            where: { id: expenseId },
            data: {
                amount: data.amount,
                description: data.description,
                dueDate: data.dueDate,
                category: data.category,
            },
            include: {
                household: true,
                paidBy: true,
                splits: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                profileImageURL: true,
                                createdAt: true,
                                updatedAt: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
                transactions: {
                    include: {
                        fromUser: true,
                        toUser: true,
                    },
                },
                receipts: true,
                history: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        await createExpenseHistory(tx, expenseId, enums_1.ExpenseAction.UPDATED, userId);
        return updatedExpense;
    }));
    const transformedExpense = (0, expenseTransformer_1.transformExpenseWithSplits)(expense);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('expense_updated', { expense: transformedExpense });
    return wrapResponse(transformedExpense);
}
/**
 * Deletes an expense from a household.
 * @param householdId - The ID of the household.
 * @param expenseId - The ID of the expense to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the expense does not exist.
 */
async function deleteExpense(householdId, expenseId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    await database_1.default.$transaction(async (prismaClient) => {
        // Verify expense exists and belongs to household
        const expense = await prismaClient.expense.findUnique({
            where: { id: expenseId },
        });
        if (!expense || expense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Expense not found in this household.');
        }
        // Delete related records first
        await prismaClient.expenseSplit.deleteMany({
            where: { expenseId },
        });
        await prismaClient.transaction.deleteMany({
            where: { expenseId },
        });
        await prismaClient.receipt.deleteMany({
            where: { expenseId },
        });
        // Use helper function for deletion history
        await createExpenseHistory(prismaClient, expenseId, enums_1.ExpenseAction.DELETED, userId);
        // Delete the expense
        await prismaClient.expense.delete({
            where: { id: expenseId },
        });
    });
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('expense_update', { expenseId, deleted: true });
    return wrapResponse(undefined);
}
/**
 * Uploads a receipt for a specific expense.
 * @param householdId ID of the household
 * @param expenseId ID of the expense
 * @param userId ID of the user uploading the receipt
 * @param data Receipt data
 * @returns The created Receipt object
 */
async function uploadReceipt(householdId, expenseId, userId, data) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const receipt = await database_1.default.$transaction(async (prismaClient) => {
        // Verify expense exists and belongs to household
        const expense = await prismaClient.expense.findUnique({
            where: { id: expenseId },
        });
        if (!expense || expense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Expense not found in this household.');
        }
        const createdReceipt = await prismaClient.receipt.create({
            data: {
                expenseId: expenseId,
                url: data.url,
                fileType: data.fileType,
            },
        });
        // Use helper function for receipt upload history
        await createExpenseHistory(prismaClient, expenseId, enums_1.ExpenseAction.RECEIPT_UPLOADED, userId);
        return createdReceipt;
    });
    const transformedReceipt = (0, expenseTransformer_1.transformReceipt)(receipt);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('receipt_uploaded', { receipt: transformedReceipt });
    return wrapResponse(transformedReceipt);
}
/**
 * Retrieves all receipts for a specific expense.
 * @param householdId ID of the household
 * @param expenseId ID of the expense
 * @param userId ID of the requesting user
 * @returns Array of Receipt objects
 */
async function getReceipts(householdId, expenseId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const receipts = await database_1.default.receipt.findMany({
        where: { expenseId },
    });
    const transformedReceipts = receipts.map((receipt) => (0, expenseTransformer_1.transformReceipt)(receipt));
    return wrapResponse(transformedReceipts);
}
/**
 * Deletes a specific receipt by ID.
 * @param householdId ID of the household
 * @param expenseId ID of the expense
 * @param receiptId ID of the receipt to delete
 * @param userId ID of the user performing the deletion
 */
async function deleteReceipt(householdId, expenseId, receiptId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    await database_1.default.$transaction(async (prismaClient) => {
        // Verify expense exists and belongs to household
        const expense = await prismaClient.expense.findUnique({
            where: { id: expenseId },
        });
        if (!expense || expense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Expense not found in this household.');
        }
        // Verify receipt exists and belongs to expense
        const receipt = await prismaClient.receipt.findUnique({
            where: { id: receiptId },
        });
        if (!receipt || receipt.expenseId !== expenseId) {
            throw new errorHandler_1.NotFoundError('Receipt not found.');
        }
        await prismaClient.receipt.delete({
            where: { id: receiptId },
        });
    });
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('receipt_deleted', { receiptId });
    return wrapResponse(undefined);
}
/**
 * Retrieves a specific receipt for an expense.
 * @param householdId ID of the household
 * @param expenseId ID of the expense
 * @param receiptId ID of the receipt
 * @param userId ID of the requesting user
 * @returns The Receipt object
 */
async function getReceiptById(householdId, expenseId, receiptId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const receipt = await database_1.default.receipt.findUnique({
        where: { id: receiptId },
    });
    if (!receipt || receipt.expenseId !== expenseId) {
        throw new errorHandler_1.NotFoundError('Receipt not found.');
    }
    const transformedReceipt = (0, expenseTransformer_1.transformReceipt)(receipt);
    return wrapResponse(transformedReceipt);
}
/**
 * Updates the splits for an expense.
 */
async function updateExpenseSplits(householdId, expenseId, splits, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    const expense = (await database_1.default.$transaction(async (tx) => {
        const existingExpense = await tx.expense.findUnique({
            where: { id: expenseId },
            include: {
                household: true,
            },
        });
        if (!existingExpense || existingExpense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Expense not found in this household');
        }
        // Delete existing splits
        await tx.expenseSplit.deleteMany({
            where: { expenseId },
        });
        // Create new splits
        await tx.expenseSplit.createMany({
            data: splits.map((split) => ({
                expenseId,
                userId: split.userId,
                amount: split.amount,
            })),
        });
        await createExpenseHistory(tx, expenseId, enums_1.ExpenseAction.SPLIT, userId);
        return await tx.expense.findUnique({
            where: { id: expenseId },
            include: {
                household: true,
                paidBy: true,
                splits: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                profileImageURL: true,
                                createdAt: true,
                                updatedAt: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
                transactions: {
                    include: {
                        fromUser: true,
                        toUser: true,
                    },
                },
                receipts: true,
                history: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }));
    const transformedExpense = (0, expenseTransformer_1.transformExpenseWithSplits)(expense);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('expense_splits_updated', { expense: transformedExpense });
    return wrapResponse(transformedExpense);
}
