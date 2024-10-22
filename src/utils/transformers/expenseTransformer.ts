import {
  Expense,
  Transaction,
  Receipt,
  ExpenseHistory,
  User,
  HouseholdExpense,
  ExpenseSplitWithUser,
  ExpenseWithSplitsAndPaidBy,
} from "@shared/types";
import { ExpenseCategory, TransactionStatus } from "@shared/enums";
import {
  PrismaExpense,
  PrismaExpenseHistory,
  PrismaExpenseSplit,
  PrismaReceipt,
  PrismaTransaction,
  PrismaUser,
} from "./transformerTypes";

function isValidExpenseCategory(category: string): category is ExpenseCategory {
  return Object.values(ExpenseCategory).includes(category as ExpenseCategory);
}

function isValidTransactionStatus(status: string): status is TransactionStatus {
  return Object.values(TransactionStatus).includes(status as TransactionStatus);
}

export function transformExpense(expense: PrismaExpense): Expense {
  return {
    ...expense,
    deletedAt: expense.deletedAt ?? undefined,
    dueDate: expense.dueDate ?? undefined,
    category: isValidExpenseCategory(expense.category)
      ? expense.category
      : ExpenseCategory.OTHER,
  };
}

export function transformExpenseWithSplits(
  expense: PrismaExpense & { splits: PrismaExpenseSplit[]; paidBy: PrismaUser }
): ExpenseWithSplitsAndPaidBy {
  return {
    ...transformExpense(expense),
    splits: expense.splits.map((split) => ({
      ...split,
      user: transformUser(split.user!),
    })),
    paidBy: transformUser(expense.paidBy),
  };
}

export function transformHouseholdExpense(
  expense: PrismaExpense & { household: { id: string; name: string } }
): HouseholdExpense {
  return {
    ...transformExpense(expense),
    household: expense.household,
  };
}

export function transformExpenseSplit(
  split: PrismaExpenseSplit
): ExpenseSplitWithUser {
  return {
    ...split,
    user: transformUser(split.user!),
  };
}

export function transformTransaction(
  transaction: PrismaTransaction
): Transaction {
  return {
    ...transaction,
    deletedAt: transaction.deletedAt ?? undefined,
    status: isValidTransactionStatus(transaction.status)
      ? transaction.status
      : TransactionStatus.PENDING,
  };
}

export function transformReceipt(receipt: PrismaReceipt): Receipt {
  return receipt;
}

export function transformExpenseHistory(
  history: PrismaExpenseHistory
): ExpenseHistory {
  return history;
}

function transformUser(user: PrismaUser): User {
  return {
    ...user,
    deletedAt: user.deletedAt ?? undefined,
    profileImageURL: user.profileImageURL ?? "",
  };
}
