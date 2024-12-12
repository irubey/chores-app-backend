import prisma from '../config/database';
import {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  UpdateExpenseSplitDTO,
  CreateReceiptDTO,
  Receipt,
  ExpenseWithSplitsAndPaidBy,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { NotFoundError, BadRequestError } from '../middlewares/errorHandler';
import { HouseholdRole, ExpenseAction } from '@shared/enums';
import { verifyMembership } from './authService';
import {
  transformExpenseWithSplits,
  transformReceipt,
} from '../utils/transformers/expenseTransformer';
import {
  PrismaExpenseWithFullRelations,
  PrismaReceiptWithFullRelations,
} from '../utils/transformers/transformerPrismaTypes';
import { getIO } from '../sockets';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Helper function to create history record
async function createExpenseHistory(
  tx: any,
  expenseId: string,
  action: ExpenseAction,
  userId: string
): Promise<void> {
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
export async function getExpenses(
  householdId: string,
  userId: string
): Promise<ApiResponse<ExpenseWithSplitsAndPaidBy[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const expenses = await prisma.expense.findMany({
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

  const transformedExpenses = expenses.map((expense) =>
    transformExpenseWithSplits(expense as PrismaExpenseWithFullRelations)
  );

  return wrapResponse(transformedExpenses);
}

/**
 * Creates a new expense within a household.
 */
export async function createExpense(
  householdId: string,
  data: CreateExpenseDTO,
  userId: string
): Promise<ApiResponse<ExpenseWithSplitsAndPaidBy>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const expense = (await prisma.$transaction(async (tx) => {
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

    await createExpenseHistory(
      tx,
      createdExpense.id,
      ExpenseAction.CREATED,
      userId
    );

    return createdExpense;
  })) as PrismaExpenseWithFullRelations;

  const transformedExpense = transformExpenseWithSplits(expense);

  getIO()
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
export async function getExpenseById(
  householdId: string,
  expenseId: string,
  userId: string
): Promise<ApiResponse<ExpenseWithSplitsAndPaidBy>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const expense = (await prisma.expense.findUnique({
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
  })) as PrismaExpenseWithFullRelations;

  if (!expense || expense.householdId !== householdId) {
    throw new NotFoundError('Expense not found in this household');
  }

  return wrapResponse(transformExpenseWithSplits(expense));
}

/**
 * Updates an existing expense.
 */
export async function updateExpense(
  householdId: string,
  expenseId: string,
  data: UpdateExpenseDTO,
  userId: string
): Promise<ApiResponse<ExpenseWithSplitsAndPaidBy>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const expense = (await prisma.$transaction(async (tx) => {
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
    })) as PrismaExpenseWithFullRelations;

    if (!existingExpense || existingExpense.householdId !== householdId) {
      throw new NotFoundError('Expense not found in this household');
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

    await createExpenseHistory(tx, expenseId, ExpenseAction.UPDATED, userId);

    return updatedExpense;
  })) as PrismaExpenseWithFullRelations;

  const transformedExpense = transformExpenseWithSplits(expense);

  getIO()
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
export async function deleteExpense(
  householdId: string,
  expenseId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.$transaction(async (prismaClient) => {
    // Verify expense exists and belongs to household
    const expense = await prismaClient.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.householdId !== householdId) {
      throw new NotFoundError('Expense not found in this household.');
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
    await createExpenseHistory(
      prismaClient,
      expenseId,
      ExpenseAction.DELETED,
      userId
    );

    // Delete the expense
    await prismaClient.expense.delete({
      where: { id: expenseId },
    });
  });

  getIO()
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
export async function uploadReceipt(
  householdId: string,
  expenseId: string,
  userId: string,
  data: CreateReceiptDTO
): Promise<ApiResponse<Receipt>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const receipt = await prisma.$transaction(async (prismaClient) => {
    // Verify expense exists and belongs to household
    const expense = await prismaClient.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.householdId !== householdId) {
      throw new NotFoundError('Expense not found in this household.');
    }

    const createdReceipt = await prismaClient.receipt.create({
      data: {
        expenseId: expenseId,
        url: data.url,
        fileType: data.fileType,
      },
    });

    // Use helper function for receipt upload history
    await createExpenseHistory(
      prismaClient,
      expenseId,
      ExpenseAction.RECEIPT_UPLOADED,
      userId
    );

    return createdReceipt;
  });

  const transformedReceipt = transformReceipt(
    receipt as PrismaReceiptWithFullRelations
  );
  getIO()
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
export async function getReceipts(
  householdId: string,
  expenseId: string,
  userId: string
): Promise<ApiResponse<Receipt[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const receipts = await prisma.receipt.findMany({
    where: { expenseId },
  });

  const transformedReceipts = receipts.map((receipt) =>
    transformReceipt(receipt as PrismaReceiptWithFullRelations)
  );
  return wrapResponse(transformedReceipts);
}

/**
 * Deletes a specific receipt by ID.
 * @param householdId ID of the household
 * @param expenseId ID of the expense
 * @param receiptId ID of the receipt to delete
 * @param userId ID of the user performing the deletion
 */
export async function deleteReceipt(
  householdId: string,
  expenseId: string,
  receiptId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.$transaction(async (prismaClient) => {
    // Verify expense exists and belongs to household
    const expense = await prismaClient.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense || expense.householdId !== householdId) {
      throw new NotFoundError('Expense not found in this household.');
    }

    // Verify receipt exists and belongs to expense
    const receipt = await prismaClient.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt || receipt.expenseId !== expenseId) {
      throw new NotFoundError('Receipt not found.');
    }

    await prismaClient.receipt.delete({
      where: { id: receiptId },
    });
  });

  getIO().to(`household_${householdId}`).emit('receipt_deleted', { receiptId });

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
export async function getReceiptById(
  householdId: string,
  expenseId: string,
  receiptId: string,
  userId: string
): Promise<ApiResponse<Receipt>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt || receipt.expenseId !== expenseId) {
    throw new NotFoundError('Receipt not found.');
  }

  const transformedReceipt = transformReceipt(
    receipt as PrismaReceiptWithFullRelations
  );
  return wrapResponse(transformedReceipt);
}

/**
 * Updates the splits for an expense.
 */
export async function updateExpenseSplits(
  householdId: string,
  expenseId: string,
  splits: UpdateExpenseSplitDTO[],
  userId: string
): Promise<ApiResponse<ExpenseWithSplitsAndPaidBy>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const expense = (await prisma.$transaction(async (tx) => {
    const existingExpense = await tx.expense.findUnique({
      where: { id: expenseId },
      include: {
        household: true,
      },
    });

    if (!existingExpense || existingExpense.householdId !== householdId) {
      throw new NotFoundError('Expense not found in this household');
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

    await createExpenseHistory(tx, expenseId, ExpenseAction.SPLIT, userId);

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
  })) as PrismaExpenseWithFullRelations;

  const transformedExpense = transformExpenseWithSplits(expense);

  getIO()
    .to(`household_${householdId}`)
    .emit('expense_splits_updated', { expense: transformedExpense });

  return wrapResponse(transformedExpense);
}
