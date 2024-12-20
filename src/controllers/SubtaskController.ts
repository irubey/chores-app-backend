import { Response, NextFunction } from "express";
import * as subtaskService from "../services/subtaskService";
import { UnauthorizedError } from "../middlewares/errorHandler";
import { AuthenticatedRequest } from "../types";
import { CreateSubtaskDTO, UpdateSubtaskDTO } from "@shared/types";

/**
 * SubtaskController handles all CRUD operations related to subtasks.
 */
export class SubtaskController {
  /**
   * Adds a new subtask to a specific chore.
   */
  public static async addSubtask(
    req: AuthenticatedRequest<CreateSubtaskDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const subtaskData = req.body;
      const userId = req.user?.id;

      if (!userId || !householdId || !choreId) {
        throw new UnauthorizedError("Missing required parameters");
      }

      const response = await subtaskService.addSubtask(
        householdId,
        choreId,
        subtaskData,
        userId
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing subtask.
   */
  public static async updateSubtask(
    req: AuthenticatedRequest<UpdateSubtaskDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, subtaskId } = req.params;
      const subtaskData = req.body;
      const userId = req.user?.id;

      if (!userId || !householdId || !choreId || !subtaskId) {
        throw new UnauthorizedError("Missing required parameters");
      }

      const response = await subtaskService.updateSubtask(
        householdId,
        choreId,
        subtaskId,
        subtaskData,
        userId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets all subtasks for a specific chore.
   */
  public static async getSubtasks(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const userId = req.user?.id;

      if (!userId || !householdId || !choreId) {
        throw new UnauthorizedError("Missing required parameters");
      }

      const response = await subtaskService.getSubtasks(
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
   * Deletes a subtask from a specific chore.
   */
  public static async deleteSubtask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, subtaskId } = req.params;
      const userId = req.user?.id;

      if (!userId || !householdId || !choreId || !subtaskId) {
        throw new UnauthorizedError("Missing required parameters");
      }

      await subtaskService.deleteSubtask(
        householdId,
        choreId,
        subtaskId,
        userId
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
