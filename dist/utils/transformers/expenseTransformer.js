"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformExpense = transformExpense;
exports.transformExpenseWithSplits = transformExpenseWithSplits;
exports.transformExpenseSplit = transformExpenseSplit;
exports.transformTransaction = transformTransaction;
exports.transformReceipt = transformReceipt;
exports.transformExpenseHistory = transformExpenseHistory;
exports.transformToHouseholdExpense = transformToHouseholdExpense;
exports.transformTransactionWithDetails = transformTransactionWithDetails;
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const userTransformer_1 = require("./userTransformer");
function isValidExpenseCategory(category) {
    return Object.values(enums_1.ExpenseCategory).includes(category);
}
function isValidTransactionStatus(status) {
    return Object.values(enums_1.TransactionStatus).includes(status);
}
function transformExpense(expense) {
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
            : enums_1.ExpenseCategory.OTHER,
        dueDate: expense.dueDate ?? undefined,
    };
}
function transformExpenseWithSplits(expense) {
    return {
        ...transformExpense(expense),
        splits: expense.splits.map(transformExpenseSplit),
        paidBy: (0, userTransformer_1.transformUser)(expense.paidBy),
    };
}
function transformExpenseSplit(split) {
    return {
        id: split.id,
        expenseId: split.expenseId,
        userId: split.userId,
        amount: split.amount,
        user: (0, userTransformer_1.transformUser)(split.user),
    };
}
function transformTransaction(transaction) {
    return {
        id: transaction.id,
        expenseId: transaction.expenseId,
        fromUserId: transaction.fromUserId,
        toUserId: transaction.toUserId,
        amount: transaction.amount,
        status: isValidTransactionStatus(transaction.status)
            ? transaction.status
            : enums_1.TransactionStatus.PENDING,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        deletedAt: transaction.deletedAt ?? undefined,
    };
}
function transformReceipt(receipt) {
    return {
        id: receipt.id,
        expenseId: receipt.expenseId,
        url: receipt.url,
        fileType: receipt.fileType,
        createdAt: receipt.createdAt,
    };
}
function transformExpenseHistory(history) {
    return {
        id: history.id,
        expenseId: history.expenseId,
        action: history.action,
        changedById: history.changedById,
        changedAt: history.changedAt,
    };
}
function transformToHouseholdExpense(expense) {
    return {
        ...transformExpense(expense),
        household: {
            id: expense.household.id,
            name: expense.household.name,
        },
    };
}
function transformTransactionWithDetails(transaction) {
    if (!transaction.fromUser || !transaction.toUser) {
        throw new Error('Transaction must have fromUser and toUser');
    }
    return {
        ...transformTransaction(transaction),
        fromUser: (0, userTransformer_1.transformUser)(transaction.fromUser),
        toUser: (0, userTransformer_1.transformUser)(transaction.toUser),
    };
}
