import { TransactionStatus, HouseholdRole } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { getIO } from '../sockets';
/**
 * Retrieves all transactions for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of transactions.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getTransactions(householdId, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const transactions = await prisma.transaction.findMany({
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
    return transactions;
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
export async function createTransaction(householdId, data, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    // Verify the related expense exists and belongs to the household
    const expense = await prisma.expense.findUnique({
        where: { id: data.expenseId },
    });
    if (!expense || expense.householdId !== householdId) {
        throw new NotFoundError('Related expense not found.');
    }
    // Create the transaction
    const transaction = await prisma.transaction.create({
        data: {
            expenseId: data.expenseId,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            amount: data.amount,
            status: data.status || TransactionStatus.PENDING,
        },
        include: {
            fromUser: true,
            toUser: true,
            expense: true,
        },
    });
    // Emit real-time event for new transaction
    getIO().to(`household_${householdId}`).emit('transaction_update', { transaction });
    return transaction;
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
export async function updateTransactionStatus(householdId, transactionId, status, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    // Fetch the transaction
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
    });
    if (!transaction || transaction.expenseId !== householdId) {
        throw new NotFoundError('Transaction not found.');
    }
    // Optionally, verify if the user has permission to update (e.g., is admin or involved in the transaction)
    if (membership.role !== HouseholdRole.ADMIN && transaction.fromUserId !== userId && transaction.toUserId !== userId) {
        throw new UnauthorizedError('You do not have permission to update this transaction.');
    }
    const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status },
        include: {
            fromUser: true,
            toUser: true,
            expense: true,
        },
    });
    // Emit real-time event for updated transaction
    getIO().to(`household_${householdId}`).emit('transaction_update', { transaction: updatedTransaction });
    return updatedTransaction;
}
/**
 * Deletes a transaction from a household.
 * @param householdId - The ID of the household.
 * @param transactionId - The ID of the transaction to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the transaction does not exist.
 */
export async function deleteTransaction(householdId, transactionId, userId) {
    // Verify user has ADMIN role in the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to delete this transaction.');
    }
    // Verify the transaction exists and belongs to the household
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { expense: true },
    });
    if (!transaction || transaction.expense.householdId !== householdId) {
        throw new NotFoundError('Transaction not found.');
    }
    await prisma.transaction.delete({
        where: { id: transactionId },
    });
    // Emit real-time event for deleted transaction
    getIO().to(`household_${householdId}`).emit('transaction_update', { transactionId });
}
