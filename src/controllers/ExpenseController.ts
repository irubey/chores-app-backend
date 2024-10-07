import { Response, NextFunction } from 'express';
import * as expenseService from '../services/expenseService';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';
import path from 'path';

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
  static async getExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const expenses = await expenseService.getExpenses(householdId, req.user.id);
      res.status(200).json(expenses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new expense within a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const expenseData = req.body;
      const expense = await expenseService.createExpense(householdId, expenseData, req.user.id);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific expense.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getExpenseDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing expense.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an expense from a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteExpense(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, expenseId } = req.params;
      await expenseService.deleteExpense(householdId, expenseId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Uploads a receipt file for a specific expense.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async uploadReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { householdId, expenseId } = req.params;

      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      const filePath = path.join('uploads/receipts/', req.file.filename);
      const fileType = req.file.mimetype;

      // Call the service to handle database and storage logic
      const receipt = await expenseService.uploadReceipt(householdId, expenseId, req.user.id, filePath, fileType);

      res.status(201).json(receipt);
    } catch (error) {
      next(error);
    }
  }
}