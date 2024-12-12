import { Response, NextFunction } from 'express';
import * as transactionService from '../services/transactionService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';
import { CreateTransactionDTO, UpdateTransactionDTO } from '@shared/types';

/**
 * TransactionController handles all CRUD operations related to transactions.
 */
export class TransactionController {
  /**
   * Retrieves all transactions for a specific household.
   */
  static async getTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const response = await transactionService.getTransactions(
        householdId,
        req.user.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new transaction within a household.
   */
  static async createTransaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const transactionData: CreateTransactionDTO = {
        expenseId: req.body.expenseId,
        fromUserId: req.body.fromUserId,
        toUserId: req.body.toUserId,
        amount: req.body.amount,
        status: req.body.status,
      };

      const response = await transactionService.createTransaction(
        householdId,
        transactionData,
        req.user.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a specific transaction.
   */
  static async updateTransactionStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, transactionId } = req.params;
      const updateData: UpdateTransactionDTO = {
        status: req.body.status,
      };

      const response = await transactionService.updateTransactionStatus(
        householdId,
        transactionId,
        updateData,
        req.user.id
      );

      if (!response) {
        throw new NotFoundError(
          'Transaction not found or you do not have permission to update it'
        );
      }
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a transaction from a household.
   */
  static async deleteTransaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, transactionId } = req.params;
      await transactionService.deleteTransaction(
        householdId,
        transactionId,
        req.user.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
