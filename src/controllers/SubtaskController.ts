import { Response, NextFunction } from "express";
import * as subtaskService from "../services/subtaskService";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { AuthenticatedRequest } from "../types";
import { CreateSubtaskDTO, UpdateSubtaskDTO } from "@shared/types";

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
  static async addSubtask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }

      const { householdId, choreId } = req.params;
      const subtaskData: CreateSubtaskDTO = req.body;

      const subtask = await subtaskService.addSubtask(
        householdId,
        choreId,
        subtaskData,
        req.user.id
      );
      res.status(201).json(subtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing subtask.
   */
  static async updateSubtask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }

      const { householdId, choreId, subtaskId } = req.params;
      const subtaskData: UpdateSubtaskDTO = req.body;

      const updatedSubtask = await subtaskService.updateSubtask(
        householdId,
        choreId,
        subtaskId,
        subtaskData,
        req.user.id
      );

      res.status(200).json(updatedSubtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets all subtasks for a specific chore.
   */
  static async getSubtasks(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }

      const { householdId, choreId } = req.params;

      const subtasks = await subtaskService.getSubtasks(
        householdId,
        choreId,
        req.user.id
      );
      res.status(200).json(subtasks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets a specific subtask by ID.
   */
  static async getSubtaskById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }

      const { householdId, choreId, subtaskId } = req.params;

      const subtask = await subtaskService.getSubtaskById(
        householdId,
        choreId,
        subtaskId,
        req.user.id
      );
      res.status(200).json(subtask);
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
  static async deleteSubtask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }

      const { householdId, choreId, subtaskId } = req.params;

      await subtaskService.deleteSubtask(
        householdId,
        choreId,
        subtaskId,
        req.user.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
