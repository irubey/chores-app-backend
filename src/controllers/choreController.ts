import { Response, NextFunction } from "express";
import * as choreService from "../services/choreService";
import { UnauthorizedError } from "../middlewares/errorHandler";
import { CreateChoreDTO, UpdateChoreDTO } from "@shared/types";
import { AuthenticatedRequest } from "../types";

/**
 * ChoreController handles all CRUD operations related to chores.
 */
export class ChoreController {
  /**
   * Retrieves all chores for a specific household.
   */
  public static async getChores(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const userId = req.user?.id;

      if (!userId || !householdId) {
        throw new UnauthorizedError(
          "User not authenticated or invalid household"
        );
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
  public static async createChore(
    req: AuthenticatedRequest<CreateChoreDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const choreData = req.body;
      const userId = req.user?.id;

      if (!userId || !householdId) {
        throw new UnauthorizedError(
          "User not authenticated or invalid household"
        );
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
  public static async getChoreDetails(
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
  public static async updateChore(
    req: AuthenticatedRequest<UpdateChoreDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      if (!userId || !householdId || !choreId) {
        throw new UnauthorizedError("Missing required parameters");
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
  public static async deleteChore(
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

      await choreService.deleteChore(householdId, choreId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a chore swap request.
   */
  public static async createChoreSwapRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const { targetUserId } = req.body;
      const requestingUserId = req.user?.id;

      if (!requestingUserId || !householdId || !choreId) {
        throw new UnauthorizedError("Missing required parameters");
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
  public static async approveOrRejectChoreSwap(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, swapRequestId } = req.params;
      const { approved } = req.body;
      const approvingUserId = req.user?.id;

      if (!approvingUserId || !householdId || !choreId || !swapRequestId) {
        throw new UnauthorizedError("Missing required parameters");
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
