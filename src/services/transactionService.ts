import { TransactionStatus, HouseholdRole } from '@shared/enums';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { getIO } from '../sockets';
import { verifyMembership } from './authService';
import {
  transformTransaction,
  transformTransactionWithDetails,
} from '../utils/transformers/expenseTransformer';
import {
  PrismaTransactionWithFullRelations,
  PrismaTransactionBase,
} from '../utils/transformers/transformerPrismaTypes';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import {
  Transaction,
  TransactionWithDetails,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '@shared/types';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Retrieves all transactions for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of transactions.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getTransactions(
  householdId: string,
  userId: string
): Promise<ApiResponse<Transaction[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

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

  const transformedTransactions = transactions.map((transaction) =>
    transformTransactionWithDetails(
      transaction as PrismaTransactionWithFullRelations
    )
  );
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
export async function createTransaction(
  householdId: string,
  data: CreateTransactionDTO,
  userId: string
): Promise<ApiResponse<TransactionWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const transaction = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.findUnique({
      where: { id: data.expenseId },
    });

    if (!expense || expense.householdId !== householdId) {
      throw new NotFoundError('Related expense not found.');
    }

    return tx.transaction.create({
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

  const transformedTransaction = transformTransactionWithDetails(
    transaction as PrismaTransactionWithFullRelations
  );

  getIO()
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
export async function updateTransactionStatus(
  householdId: string,
  transactionId: string,
  data: UpdateTransactionDTO,
  userId: string
): Promise<ApiResponse<TransactionWithDetails>> {
  const membership = await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const transaction = await prisma.$transaction(async (tx) => {
    const existingTransaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { expense: true },
    });

    if (
      !existingTransaction ||
      existingTransaction.expense.householdId !== householdId
    ) {
      throw new NotFoundError('Transaction not found.');
    }

    if (
      membership.role !== HouseholdRole.ADMIN &&
      existingTransaction.fromUserId !== userId &&
      existingTransaction.toUserId !== userId
    ) {
      throw new UnauthorizedError(
        'You do not have permission to update this transaction.'
      );
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

  const transformedTransaction = transformTransactionWithDetails(
    transaction as PrismaTransactionWithFullRelations
  );

  getIO()
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
export async function deleteTransaction(
  householdId: string,
  transactionId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { expense: true },
    });

    if (!transaction || transaction.expense.householdId !== householdId) {
      throw new NotFoundError('Transaction not found.');
    }

    await tx.transaction.delete({
      where: { id: transactionId },
    });
  });

  getIO()
    .to(`household_${householdId}`)
    .emit('transaction_deleted', { transactionId });

  return wrapResponse(undefined);
}
