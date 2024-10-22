import { Response, NextFunction } from "express";
import * as choreService from "../services/choreService";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  CreateSubtaskDTO,
} from "@shared/types";
import { AuthenticatedRequest } from "../types";
import { SubtaskStatus } from "@shared/enums";

/**
 * ChoreController handles all CRUD operations related to chores.
 */
export class ChoreController {
  /**
   * Retrieves all chores for a specific household.
   * @param req Authenticated Express Request object containing householdId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
        throw new UnauthorizedError("Unauthorized");
      }

      const chores = await choreService.getChores(householdId, userId);
      res.status(200).json(chores);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new chore.
   * @param req Authenticated Express Request object containing chore data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
        throw new UnauthorizedError("Unauthorized");
      }

      const chore = await choreService.createChore(
        householdId,
        choreData,
        userId
      );
      res.status(201).json(chore);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific chore.
   * @param req Authenticated Express Request object containing householdId and choreId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
        throw new UnauthorizedError("Unauthorized");
      }

      const chore = await choreService.getChoreById(
        householdId,
        choreId,
        userId
      );
      res.status(200).json(chore);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing chore.
   * @param req Authenticated Express Request object containing householdId, choreId, and update data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
        throw new UnauthorizedError("Unauthorized");
      }

      const updatedChore = await choreService.updateChore(
        householdId,
        choreId,
        updateData,
        userId
      );
      res.status(200).json(updatedChore);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a chore.
   * @param req Authenticated Express Request object containing householdId and choreId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
        throw new UnauthorizedError("Unauthorized");
      }

      await choreService.deleteChore(householdId, choreId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds a subtask to a chore.
   * @param req Authenticated Express Request object containing householdId, choreId, and subtask data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async addSubtask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const subtaskData: CreateSubtaskDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const newSubtask = await choreService.addSubtask(
        householdId,
        choreId,
        subtaskData,
        userId
      );
      res.status(201).json(newSubtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a subtask.
   * @param req Authenticated Express Request object containing householdId, choreId, subtaskId, and status
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateSubtaskStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, subtaskId } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const updatedSubtask = await choreService.updateSubtaskStatus(
        householdId,
        choreId,
        subtaskId,
        status as SubtaskStatus,
        userId
      );
      res.status(200).json(updatedSubtask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a subtask from a chore.
   * @param req Authenticated Express Request object containing householdId, choreId, and subtaskId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteSubtask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, subtaskId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      await choreService.deleteSubtask(householdId, choreId, subtaskId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Requests a chore swap.
   * @param req Authenticated Express Request object containing householdId, choreId, and targetUserId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async requestChoreSwap(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const { targetUserId } = req.body;
      const requestingUserId = req.user?.id;

      if (!requestingUserId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const swapRequest = await choreService.requestChoreSwap(
        householdId,
        choreId,
        requestingUserId,
        targetUserId
      );
      res.status(201).json(swapRequest);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approves or rejects a chore swap request.
   * @param req Authenticated Express Request object containing householdId, choreId, swapRequestId, and approved status
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async approveChoreSwap(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, swapRequestId } = req.params;
      const { approved } = req.body;
      const approvingUserId = req.user?.id;

      if (!approvingUserId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const updatedChore = await choreService.approveChoreSwap(
        householdId,
        choreId,
        swapRequestId,
        approved,
        approvingUserId
      );
      res.status(200).json(updatedChore);
    } catch (error) {
      next(error);
    }
  }
}
