import prisma from "../config/database";
import {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  CreateExpenseSplitDTO,
  UpdateExpenseSplitDTO,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  CreateReceiptDTO,
  CreateExpenseHistoryDTO,
  Expense,
  ExpenseSplit,
  Transaction,
  Receipt,
  ExpenseHistory,
  ExpenseWithSplits,
  HouseholdExpense,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../middlewares/errorHandler";
import {
  HouseholdRole,
  ExpenseCategory,
  TransactionStatus,
  ExpenseAction,
} from "@shared/enums";
import { verifyMembership } from "./authService";
import {
  transformExpense,
  transformExpenseWithSplits,
  transformHouseholdExpense,
  transformExpenseSplit,
  transformTransaction,
  transformReceipt,
  transformExpenseHistory,
} from "../utils/transformers/expenseTransformer";
import {
  PrismaExpenseSplit,
  PrismaTransaction,
  PrismaReceipt,
  PrismaExpenseHistory,
  PrismaExpense,
} from "../utils/transformers/transformerTypes";
import { getIO } from "../sockets";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
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
): Promise<ApiResponse<Expense[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const expenses = await prisma.expense.findMany({
    where: { householdId },
    include: {
      splits: true,
      paidBy: true,
      transactions: true,
    },
  });

  const transformedExpenses = expenses.map((expense) =>
    transformExpense(expense as PrismaExpense)
  );
  return wrapResponse(transformedExpenses);
}

/**
 * Creates a new expense within a household.
 * @param householdId - The ID of the household.
 * @param data - The expense data.
 * @param userId - The ID of the user creating the expense.
 * @returns The created expense.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 */
export async function createExpense(
  householdId: string,
  data: CreateExpenseDTO,
  userId: string
): Promise<ApiResponse<Expense>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const expense = await prisma.$transaction(async (prismaClient) => {
    const createdExpense = await prismaClient.expense.create({
      data: {
        householdId: data.householdId,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        category: data.category,
        paidById: data.paidById,
      },
      include: {
        paidBy: true,
      },
    });

    if (data.splits && data.splits.length > 0) {
      await prismaClient.expenseSplit.createMany({
        data: data.splits.map((split: CreateExpenseSplitDTO) => ({
          expenseId: createdExpense.id,
          userId: split.userId,
          amount: split.amount,
        })),
      });
    }

    return prismaClient.expense.findUnique({
      where: { id: createdExpense.id },
      include: {
        splits: true,
        paidBy: true,
        transactions: true,
      },
    });
  });

  if (!expense) {
    throw new BadRequestError("Failed to create expense.");
  }

  const transformedExpense = transformExpense(expense as PrismaExpense);
  getIO()
    .to(`household_${householdId}`)
    .emit("expense_update", { expense: transformedExpense });

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
): Promise<ApiResponse<Expense>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      splits: true,
      paidBy: true,
      transactions: true,
    },
  });

  if (!expense) {
    throw new NotFoundError("Expense not found.");
  }

  const transformedExpense = transformExpense(expense as PrismaExpense);
  return wrapResponse(transformedExpense);
}

/**
 * Updates an existing expense.
 * @param householdId - The ID of the household.
 * @param expenseId - The ID of the expense to update.
 * @param data - The updated expense data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated expense.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the expense does not exist.
 */
export async function updateExpense(
  householdId: string,
  expenseId: string,
  data: UpdateExpenseDTO,
  userId: string
): Promise<ApiResponse<Expense>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      amount: data.amount,
      description: data.description,
      dueDate: data.dueDate,
      category: data.category,
      splits: data.splits
        ? {
            deleteMany: {},
            create: data.splits.map((split: UpdateExpenseSplitDTO) => ({
              userId: split.userId,
              amount: split.amount,
            })),
          }
        : undefined,
    },
    include: {
      splits: true,
      paidBy: true,
      transactions: true,
    },
  });

  const transformedExpense = transformExpense(expense as PrismaExpense);
  getIO()
    .to(`household_${householdId}`)
    .emit("expense_update", { expense: transformedExpense });

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

  await prisma.expense.delete({
    where: { id: expenseId },
  });

  getIO()
    .to(`household_${householdId}`)
    .emit("expense_update", { expenseId, deleted: true });

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

  const receipt = await prisma.receipt.create({
    data: {
      expenseId: expenseId,
      url: data.url,
      fileType: data.fileType,
    },
  });

  const transformedReceipt = transformReceipt(receipt as PrismaReceipt);
  getIO()
    .to(`household_${householdId}`)
    .emit("receipt_uploaded", { receipt: transformedReceipt });

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
    transformReceipt(receipt as PrismaReceipt)
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

  await prisma.receipt.delete({
    where: { id: receiptId },
  });

  getIO().to(`household_${householdId}`).emit("receipt_deleted", { receiptId });

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
    throw new NotFoundError("Receipt not found.");
  }

  const transformedReceipt = transformReceipt(receipt as PrismaReceipt);
  return wrapResponse(transformedReceipt);
}
