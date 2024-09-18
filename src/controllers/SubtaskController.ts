import { Response, NextFunction } from 'express';
import * as subtaskService from '../services/subtaskService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * SubtaskController handles all CRUD operations related to subtasks.
 */
export class SubtaskController {
  /**
   * Adds a new subtask to a specific chore.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async addSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const subtaskData = req.body;

      const subtask = await subtaskService.addSubtask(householdId, choreId, subtaskData, req.user?.id);
      res.status(201).json(subtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of an existing subtask.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateSubtaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { householdId, choreId, subtaskId } = req.params;
      const { status } = req.body;

      const updatedSubtask = await subtaskService.updateSubtaskStatus(
        householdId,
        choreId,
        subtaskId,
        status,
        req.user?.id
      );

      res.status(200).json(updatedSubtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a subtask from a specific chore.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { householdId, choreId, subtaskId } = req.params;

      await subtaskService.deleteSubtask(householdId, choreId, subtaskId, req.user?.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}