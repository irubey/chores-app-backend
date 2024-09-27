import * as expenseService from '../services/expenseService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
/**
 * ExpenseController handles all CRUD operations related to expenses.
 */
export class ExpenseController {
    /**
     * Retrieves all expenses for a specific household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async getExpenses(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const householdId = req.params.householdId;
            const expenses = await expenseService.getExpenses(householdId, req.user.id);
            res.status(200).json(expenses);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new expense within a household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async createExpense(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const householdId = req.params.householdId;
            const expenseData = req.body;
            const expense = await expenseService.createExpense(householdId, expenseData, req.user.id);
            res.status(201).json(expense);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific expense.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async getExpenseDetails(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, expenseId } = req.params;
            const expense = await expenseService.getExpenseById(householdId, expenseId, req.user.id);
            if (!expense) {
                throw new NotFoundError('Expense not found');
            }
            res.status(200).json(expense);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing expense.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async updateExpense(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, expenseId } = req.params;
            const updateData = req.body;
            const updatedExpense = await expenseService.updateExpense(householdId, expenseId, updateData, req.user.id);
            if (!updatedExpense) {
                throw new NotFoundError('Expense not found or you do not have permission to update it');
            }
            res.status(200).json(updatedExpense);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes an expense from a household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async deleteExpense(req, res, next) {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Unauthorized');
            }
            const { householdId, expenseId } = req.params;
            await expenseService.deleteExpense(householdId, expenseId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
