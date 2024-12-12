import { Response, NextFunction } from 'express';
import * as expenseService from '../services/expenseService';
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';
import path from 'path';
import { UpdateExpenseSplitDTO } from '@shared/types';

/**
 * ExpenseController handles all CRUD operations related to expenses.
 */
export class ExpenseController {
  /**
   * Retrieves all expenses for a specific household.
   */
  static async getExpenses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const response = await expenseService.getExpenses(
        householdId,
        req.user.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new expense within a household.
   */
  static async createExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const expenseData = req.body;
      const response = await expenseService.createExpense(
        householdId,
        expenseData,
        req.user.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific expense.
   */
  static async getExpenseDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, expenseId } = req.params;
      const response = await expenseService.getExpenseById(
        householdId,
        expenseId,
        req.user.id
      );
      if (!response) {
        throw new NotFoundError('Expense not found');
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing expense.
   */
  static async updateExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, expenseId } = req.params;
      const updateData = req.body;
      const response = await expenseService.updateExpense(
        householdId,
        expenseId,
        updateData,
        req.user.id
      );
      if (!response) {
        throw new NotFoundError(
          'Expense not found or you do not have permission to update it'
        );
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an expense from a household.
   */
  static async deleteExpense(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
   */
  static async uploadReceipt(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
      const response = await expenseService.uploadReceipt(
        householdId,
        expenseId,
        req.user.id,
        {
          url: filePath,
          fileType: fileType,
          expenseId: expenseId,
        }
      );

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all receipts for a specific expense.
   */
  static async getReceipts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, expenseId } = req.params;
      const response = await expenseService.getReceipts(
        householdId,
        expenseId,
        req.user.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific receipt by ID.
   */
  static async getReceiptById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, expenseId, receiptId } = req.params;
      const response = await expenseService.getReceiptById(
        householdId,
        expenseId,
        receiptId,
        req.user.id
      );
      if (!response) {
        throw new NotFoundError('Receipt not found');
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a specific receipt by ID.
   */
  static async deleteReceipt(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, expenseId, receiptId } = req.params;
      await expenseService.deleteReceipt(
        householdId,
        expenseId,
        receiptId,
        req.user.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the splits for an expense.
   */
  static async updateExpenseSplits(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { householdId, expenseId } = req.params;
      const splits: UpdateExpenseSplitDTO[] = req.body.splits;

      const response = await expenseService.updateExpenseSplits(
        householdId,
        expenseId,
        splits,
        req.user.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
