import {
  Expense,
  Transaction,
  Receipt,
  ExpenseHistory,
  ExpenseWithSplitsAndPaidBy,
  ExpenseSplitWithUser,
  HouseholdExpense,
  TransactionWithDetails,
} from '@shared/types';
import {
  ExpenseAction,
  ExpenseCategory,
  TransactionStatus,
} from '@shared/enums';
import {
  PrismaExpenseBase,
  PrismaExpenseWithFullRelations,
  PrismaExpenseSplitWithRelations,
  PrismaTransactionWithRelations,
  PrismaReceiptWithFullRelations,
  PrismaExpenseHistoryWithFullRelations,
  PrismaTransactionWithFullRelations,
} from './transformerPrismaTypes';
import { transformUser } from './userTransformer';

function isValidExpenseCategory(category: string): category is ExpenseCategory {
  return Object.values(ExpenseCategory).includes(category as ExpenseCategory);
}

function isValidTransactionStatus(status: string): status is TransactionStatus {
  return Object.values(TransactionStatus).includes(status as TransactionStatus);
}

export function transformExpense(expense: PrismaExpenseBase): Expense {
  return {
    id: expense.id,
    householdId: expense.householdId,
    amount: expense.amount,
    description: expense.description,
    paidById: expense.paidById,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    deletedAt: expense.deletedAt ?? undefined,
    category: isValidExpenseCategory(expense.category)
      ? expense.category
      : ExpenseCategory.OTHER,
    dueDate: expense.dueDate ?? undefined,
  };
}

export function transformExpenseWithSplits(
  expense: PrismaExpenseWithFullRelations
): ExpenseWithSplitsAndPaidBy {
  return {
    ...transformExpense(expense),
    splits: expense.splits.map(transformExpenseSplit),
    paidBy: transformUser(expense.paidBy),
  };
}

export function transformExpenseSplit(
  split: PrismaExpenseSplitWithRelations
): ExpenseSplitWithUser {
  return {
    id: split.id,
    expenseId: split.expenseId,
    userId: split.userId,
    amount: split.amount,
    user: transformUser(split.user),
  };
}

export function transformTransaction(
  transaction: PrismaTransactionWithRelations
): Transaction {
  return {
    id: transaction.id,
    expenseId: transaction.expenseId,
    fromUserId: transaction.fromUserId,
    toUserId: transaction.toUserId,
    amount: transaction.amount,
    status: isValidTransactionStatus(transaction.status)
      ? transaction.status
      : TransactionStatus.PENDING,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    deletedAt: transaction.deletedAt ?? undefined,
  };
}

export function transformReceipt(
  receipt: PrismaReceiptWithFullRelations
): Receipt {
  return {
    id: receipt.id,
    expenseId: receipt.expenseId,
    url: receipt.url,
    fileType: receipt.fileType,
    createdAt: receipt.createdAt,
  };
}

export function transformExpenseHistory(
  history: PrismaExpenseHistoryWithFullRelations
): ExpenseHistory {
  return {
    id: history.id,
    expenseId: history.expenseId,
    action: history.action as ExpenseAction,
    changedById: history.changedById,
    changedAt: history.changedAt,
  };
}

export function transformToHouseholdExpense(
  expense: PrismaExpenseWithFullRelations
): HouseholdExpense {
  return {
    ...transformExpense(expense),
    household: {
      id: expense.household.id,
      name: expense.household.name,
    },
  };
}

export function transformTransactionWithDetails(
  transaction: PrismaTransactionWithFullRelations
): TransactionWithDetails {
  if (!transaction.fromUser || !transaction.toUser) {
    throw new Error('Transaction must have fromUser and toUser');
  }

  return {
    ...transformTransaction(transaction),
    fromUser: transformUser(transaction.fromUser),
    toUser: transformUser(transaction.toUser),
  };
}
