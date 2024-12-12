import { Response, NextFunction } from 'express';
import * as choreService from '../services/choreService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { CreateChoreDTO, UpdateChoreDTO } from '@shared/types';
import { AuthenticatedRequest } from '../types';

/**
 * ChoreController handles all CRUD operations related to chores.
 */
export class ChoreController {
  /**
   * Retrieves all chores for a specific household.
   */
  static async getChores(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const householdId = req.params.householdId;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const response = await choreService.getChores(householdId, userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new chore.
   */
  static async createChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const householdId = req.params.householdId;
      const choreData: CreateChoreDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const response = await choreService.createChore(
        householdId,
        choreData,
        userId
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific chore.
   */
  static async getChoreDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const response = await choreService.getChoreById(
        householdId,
        choreId,
        userId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing chore.
   */
  static async updateChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const updateData: UpdateChoreDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const response = await choreService.updateChore(
        householdId,
        choreId,
        updateData,
        userId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a chore.
   */
  static async deleteChore(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      await choreService.deleteChore(householdId, choreId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Requests a chore swap.
   */
  static async createChoreSwapRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const { targetUserId } = req.body;
      const requestingUserId = req.user?.id;

      if (!requestingUserId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const response = await choreService.createChoreSwapRequest(
        householdId,
        { choreId, targetUserId },
        requestingUserId
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approves or rejects a chore swap request.
   */
  static async approveOrRejectChoreSwap(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, swapRequestId } = req.params;
      const { approved } = req.body;
      const approvingUserId = req.user?.id;

      if (!approvingUserId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const response = await choreService.approveOrRejectChoreSwap(
        householdId,
        choreId,
        swapRequestId,
        approved,
        approvingUserId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
