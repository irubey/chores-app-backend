import { Response, NextFunction } from "express";
import * as householdService from "../services/householdService";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import {
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
} from "@shared/types";
import { AuthenticatedRequest } from "../types";

/**
 * HouseholdController handles all CRUD operations related to households.
 */
export class HouseholdController {
  /**
   * Creates a new household.
   */
  static async createHousehold(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const householdData: CreateHouseholdDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.createHousehold(
        householdData,
        userId
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific household.
   */
  static async getHousehold(
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

      const includeMembersParam = req.query.includeMembers;
      const includeMembers =
        includeMembersParam === "true" ||
        (Array.isArray(includeMembersParam) &&
          includeMembersParam[0] === "true");

      const response = await householdService.getHouseholdById(
        householdId,
        userId,
        includeMembers
      );

      if (!response) {
        throw new NotFoundError("Household not found");
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing household.
   */
  static async updateHousehold(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const householdId = req.params.householdId;
      const updateData: UpdateHouseholdDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.updateHousehold(
        householdId,
        updateData,
        userId
      );

      if (!response) {
        throw new NotFoundError(
          "Household not found or you do not have permission to update it"
        );
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a household.
   */
  static async deleteHousehold(
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

      await householdService.deleteHousehold(householdId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds a new member to the household.
   */
  static async addMember(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const householdId = req.params.householdId;
      const memberData: AddMemberDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.addMember(
        householdId,
        memberData,
        userId
      );

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all members of a specific household.
   */
  static async getMembers(
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

      const response = await householdService.getMembers(householdId, userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes a member from the household.
   */
  static async removeMember(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const householdId = req.params.householdId;
      const memberId = req.params.memberId;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      await householdService.removeMember(householdId, memberId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all households selected by the authenticated user.
   */
  static async getSelectedHouseholds(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.getSelectedHouseholds(userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the selection of a household member.
   */
  static async updateSelectedHousehold(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const { isSelected } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      if (req.params.memberId !== userId) {
        throw new UnauthorizedError(
          "You can only update your own household selection"
        );
      }

      const response = await householdService.updateSelectedHousehold(
        householdId,
        userId,
        isSelected
      );

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a household member.
   */
  static async acceptOrRejectInvitation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, memberId } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      if (memberId !== userId) {
        throw new UnauthorizedError("You can only update your own status");
      }

      const response = await householdService.acceptOrRejectInvitation(
        householdId,
        memberId,
        status
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the role of a household member.
   */
  static async updateMemberRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.updateMemberRole(
        householdId,
        memberId,
        role,
        userId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all households for the authenticated user.
   */
  static async getUserHouseholds(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.getUserHouseholds(userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sends an invitation to a user to join a household.
   */
  static async sendInvitation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const { email } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const response = await householdService.sendInvitation(
        householdId,
        { email },
        userId
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}
