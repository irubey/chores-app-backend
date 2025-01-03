import { HouseholdRole } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { getIO } from '../sockets';
/**
 * Retrieves all expenses for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of expenses.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getExpenses(householdId, userId) {
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
    const expenses = await prisma.expense.findMany({
        where: { householdId },
        include: {
            splits: true,
            paidBy: true,
            transactions: true,
        },
    });
    return expenses;
}
/**
 * Creates a new expense within a household.
 * @param householdId - The ID of the household.
 * @param data - The expense data.
 * @param userId - The ID of the user creating the expense.
 * @returns The created expense.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 */
export async function createExpense(householdId, data, userId) {
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
        throw new UnauthorizedError('You do not have permission to create an expense.');
    }
    // Ensure that all splits have defined userId and amount
    if (data.splits) {
        data.splits.forEach((split) => {
            if (!split.userId || split.amount == null) {
                throw new Error('Each split must have a userId and amount.');
            }
        });
    }
    const expense = await prisma.expense.create({
        data: {
            householdId: data.householdId,
            amount: data.amount,
            description: data.description,
            dueDate: data.dueDate,
            category: data.category,
            paidById: data.paidById, // Changed from 'paidBy' to 'paidById'
            splits: {
                create: data.splits?.map((split) => ({
                    userId: split.userId,
                    amount: split.amount,
                })) || [],
            },
        },
        include: {
            splits: true,
            paidBy: true,
            transactions: true,
        },
    });
    // Emit real-time event for new expense
    getIO().to(`household_${householdId}`).emit('expense_update', { expense });
    return expense;
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
export async function getExpenseById(householdId, expenseId, userId) {
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
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
            splits: true,
            paidBy: true,
            transactions: true,
        },
    });
    if (!expense) {
        throw new NotFoundError('Expense not found.');
    }
    return expense;
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
export async function updateExpense(householdId, expenseId, data, userId) {
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
        throw new UnauthorizedError('You do not have permission to update this expense.');
    }
    // Ensure that all splits have defined userId and amount
    if (data.splits) {
        data.splits.forEach((split) => {
            if (!split.userId || split.amount == null) {
                throw new Error('Each split must have a userId and amount.');
            }
        });
    }
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
                    create: data.splits.map((split) => ({
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
    if (!expense) {
        throw new NotFoundError('Expense not found or you do not have permission to update it.');
    }
    // Emit real-time event for updated expense
    getIO().to(`household_${householdId}`).emit('expense_update', { expense });
    return expense;
}
/**
 * Deletes an expense from a household.
 * @param householdId - The ID of the household.
 * @param expenseId - The ID of the expense to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the expense does not exist.
 */
export async function deleteExpense(householdId, expenseId, userId) {
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
        throw new UnauthorizedError('You do not have permission to delete this expense.');
    }
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
    });
    if (!expense) {
        throw new NotFoundError('Expense not found.');
    }
    await prisma.expense.delete({
        where: { id: expenseId },
    });
    // Emit real-time event for deleted expense
    getIO().to(`household_${householdId}`).emit('expense_update', { expenseId });
}
