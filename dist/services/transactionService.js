"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
exports.createTransaction = createTransaction;
exports.updateTransactionStatus = updateTransactionStatus;
exports.deleteTransaction = deleteTransaction;
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const errorHandler_1 = require("../middlewares/errorHandler");
const database_1 = __importDefault(require("../config/database"));
const sockets_1 = require("../sockets");
const authService_1 = require("./authService");
const expenseTransformer_1 = require("../utils/transformers/expenseTransformer");
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
/**
 * Retrieves all transactions for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of transactions.
 * @throws UnauthorizedError if the user is not a household member.
 */
async function getTransactions(householdId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const transactions = await database_1.default.transaction.findMany({
        where: { expense: { householdId } },
        include: {
            fromUser: true,
            toUser: true,
            expense: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const transformedTransactions = transactions.map((transaction) => (0, expenseTransformer_1.transformTransactionWithDetails)(transaction));
    return wrapResponse(transformedTransactions);
}
/**
 * Creates a new transaction within a household.
 * @param householdId - The ID of the household.
 * @param data - The transaction data.
 * @param userId - The ID of the user creating the transaction.
 * @returns The created transaction.
 * @throws UnauthorizedError if the user is not a household member or insufficient permissions.
 * @throws NotFoundError if the related expense does not exist.
 */
async function createTransaction(householdId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const transaction = await database_1.default.$transaction(async (tx) => {
        const expense = await tx.expense.findUnique({
            where: { id: data.expenseId },
        });
        if (!expense || expense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Related expense not found.');
        }
        return tx.transaction.create({
            data: {
                expenseId: data.expenseId,
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                amount: data.amount,
                status: data.status || enums_1.TransactionStatus.PENDING,
            },
            include: {
                fromUser: true,
                toUser: true,
                expense: {
                    include: {
                        paidBy: true,
                        splits: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
    });
    const transformedTransaction = (0, expenseTransformer_1.transformTransactionWithDetails)(transaction);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('transaction_created', { transaction: transformedTransaction });
    return wrapResponse(transformedTransaction);
}
/**
 * Updates the status of an existing transaction.
 * @param householdId - The ID of the household.
 * @param transactionId - The ID of the transaction to update.
 * @param data - The updated transaction data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated transaction.
 * @throws UnauthorizedError if the user does not have ADMIN role or is not related to the transaction.
 * @throws NotFoundError if the transaction does not exist.
 */
async function updateTransactionStatus(householdId, transactionId, data, userId) {
    const membership = await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const transaction = await database_1.default.$transaction(async (tx) => {
        const existingTransaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: { expense: true },
        });
        if (!existingTransaction ||
            existingTransaction.expense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Transaction not found.');
        }
        if (membership.role !== enums_1.HouseholdRole.ADMIN &&
            existingTransaction.fromUserId !== userId &&
            existingTransaction.toUserId !== userId) {
            throw new errorHandler_1.UnauthorizedError('You do not have permission to update this transaction.');
        }
        return tx.transaction.update({
            where: { id: transactionId },
            data: { status: data.status },
            include: {
                fromUser: true,
                toUser: true,
                expense: {
                    include: {
                        paidBy: true,
                        splits: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
    });
    const transformedTransaction = (0, expenseTransformer_1.transformTransactionWithDetails)(transaction);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('transaction_updated', { transaction: transformedTransaction });
    return wrapResponse(transformedTransaction);
}
/**
 * Deletes a transaction from a household.
 * @param householdId - The ID of the household.
 * @param transactionId - The ID of the transaction to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the transaction does not exist.
 */
async function deleteTransaction(householdId, transactionId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    await database_1.default.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: { expense: true },
        });
        if (!transaction || transaction.expense.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Transaction not found.');
        }
        await tx.transaction.delete({
            where: { id: transactionId },
        });
    });
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('transaction_deleted', { transactionId });
    return wrapResponse(undefined);
}
