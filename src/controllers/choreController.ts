import { Response, NextFunction } from 'express';
import * as choreService from '../services/choreService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest, CreateSubtaskDTO, Subtask, ChoreSwapRequest } from '../types';

/**
 * ChoreController handles all CRUD operations related to chores.
 */
export class ChoreController {
  /**
   * Retrieves all chores for a specific household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getChores(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const chores = await choreService.getChores(householdId, req.user.id);
      res.status(200).json(chores);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new chore within a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async createChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const choreData = req.body;
      const chore = await choreService.createChore(householdId, choreData, req.user.id);
      res.status(201).json(chore);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific chore.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getChoreDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId } = req.params;
      const chore = await choreService.getChoreById(householdId, choreId, req.user.id);
      if (!chore) {
        throw new NotFoundError('Chore not found');
      }
      res.status(200).json(chore);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing chore.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId } = req.params;
      const updateData = req.body;
      const updatedChore = await choreService.updateChore(householdId, choreId, updateData, req.user.id);
      if (!updatedChore) {
        throw new NotFoundError('Chore not found or you do not have permission to update it');
      }
      res.status(200).json(updatedChore);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a chore from a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteChore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId } = req.params;
      await choreService.deleteChore(householdId, choreId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds a subtask to a specific chore.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async addSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId } = req.params;
      const subtaskData: CreateSubtaskDTO = req.body;
      const subtask: Subtask = await choreService.addSubtask(householdId, choreId, subtaskData, req.user.id);
      res.status(201).json(subtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a subtask.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateSubtaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId, subtaskId } = req.params;
      const { status } = req.body;
      const updatedSubtask: Subtask = await choreService.updateSubtaskStatus(
        householdId,
        choreId,
        subtaskId,
        status,
        req.user.id
      );
      if (!updatedSubtask) {
        throw new NotFoundError('Subtask not found or you do not have permission to update it');
      }
      res.status(200).json(updatedSubtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a subtask from a chore.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId, subtaskId } = req.params;
      await choreService.deleteSubtask(householdId, choreId, subtaskId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Requests a chore swap.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async requestChoreSwap(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId } = req.params;
      const { targetUserId } = req.body;
      const swapRequest: ChoreSwapRequest = await choreService.requestChoreSwap(householdId, choreId, req.user.id, targetUserId);
      res.status(201).json(swapRequest);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approves a chore swap request.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async approveChoreSwap(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, choreId } = req.params;
      const { swapRequestId, approved } = req.body;
      const result = await choreService.approveChoreSwap(householdId, choreId, swapRequestId, approved, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}