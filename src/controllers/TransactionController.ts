import { Response, NextFunction } from 'express';
import * as transactionService from '../services/transactionService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * TransactionController handles all CRUD operations related to transactions.
 */
export class TransactionController {
  /**
   * Retrieves all transactions for a specific household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const transactions = await transactionService.getTransactions(householdId, req.user.id);
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new transaction within a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async createTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const transactionData = req.body;
      const transaction = await transactionService.createTransaction(householdId, transactionData, req.user.id);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a specific transaction.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateTransactionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, transactionId } = req.params;
      const { status } = req.body;
      const updatedTransaction = await transactionService.updateTransactionStatus(
        householdId,
        transactionId,
        status,
        req.user.id
      );
      if (!updatedTransaction) {
        throw new NotFoundError('Transaction not found or you do not have permission to update it');
      }
      res.status(200).json(updatedTransaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a transaction from a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, transactionId } = req.params;
      await transactionService.deleteTransaction(householdId, transactionId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}