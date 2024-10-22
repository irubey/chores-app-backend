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
   * @param req Authenticated Express Request object containing household data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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

      const household = await householdService.createHousehold(
        householdData,
        userId
      );
      res.status(201).json(household);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific household.
   * @param req Authenticated Express Request object containing householdId and optional query parameters
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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

      // Extract includeMembers from query parameters, defaulting to false
      const includeMembersParam = req.query.includeMembers;
      const includeMembers =
        includeMembersParam === "true" ||
        (Array.isArray(includeMembersParam) &&
          includeMembersParam[0] === "true");

      const household = await householdService.getHouseholdById(
        householdId,
        userId,
        includeMembers
      );

      if (!household) {
        throw new NotFoundError("Household not found");
      }

      res.status(200).json(household);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing household.
   * @param req Authenticated Express Request object containing householdId and update data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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

      const updatedHousehold = await householdService.updateHousehold(
        householdId,
        updateData,
        userId
      );

      if (!updatedHousehold) {
        throw new NotFoundError(
          "Household not found or you do not have permission to update it"
        );
      }

      res.status(200).json(updatedHousehold);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a household.
   * @param req Authenticated Express Request object containing householdId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
   * @param req Authenticated Express Request object containing householdId and member data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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

      const newMember = await householdService.addMember(
        householdId,
        memberData,
        userId
      );

      res.status(201).json(newMember);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all members of a specific household.
   * @param req Authenticated Express Request object containing householdId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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

      const members = await householdService.getMembers(householdId, userId);
      res.status(200).json(members);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes a member from the household.
   * @param req Authenticated Express Request object containing householdId and memberId
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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
   * @param req Authenticated request containing user ID.
   * @param res Response with the list of selected households.
   * @param next Next function for error handling.
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

      const selectedHouseholds = await householdService.getSelectedHouseholds(
        userId
      );
      res.status(200).json(selectedHouseholds);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggles the selection state of a household member.
   * @param req Authenticated request containing householdId, memberId, and selection data.
   * @param res Response with the updated household member.
   * @param next Next function for error handling.
   */
  static async toggleHouseholdSelection(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, memberId } = req.params;
      const { isSelected } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      // Ensure the memberId matches the authenticated user
      if (memberId !== userId) {
        throw new UnauthorizedError(
          "You can only update your own household selection"
        );
      }

      const updatedMember =
        await householdService.updateHouseholdMemberSelection(
          householdId,
          memberId,
          isSelected
        );
      res.status(200).json(updatedMember);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a household member.
   * @param req Authenticated request containing householdId, memberId, and status data.
   * @param res Response with the updated household member.
   * @param next Next function for error handling.
   */
  static async updateMemberStatus(
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

      // Ensure the memberId matches the authenticated user
      if (memberId !== userId) {
        throw new UnauthorizedError("You can only update your own status");
      }

      const updatedMember = await householdService.updateMemberStatus(
        householdId,
        memberId,
        status
      );
      res.status(200).json(updatedMember);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the role of a household member.
   * @param req Authenticated request containing householdId, memberId, and role data.
   * @param res Response with the updated household member.
   * @param next Next function for error handling.
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

      const updatedMember = await householdService.updateMemberRole(
        householdId,
        memberId,
        role,
        userId
      );
      res.status(200).json(updatedMember);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all households for the authenticated user.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
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

      const households = await householdService.getUserHouseholds(userId);
      res.status(200).json(households);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sends an invitation to a user to join a household.
   * @param req Authenticated request containing householdId and email.
   * @param res Response with the invitation details.
   * @param next Next function for error handling.
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

      const invitation = await householdService.sendInvitation(
        householdId,
        email,
        userId
      );
      res.status(201).json(invitation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accepts a household invitation.
   * @param req Authenticated request containing invitation token.
   * @param res Response with the accepted household.
   * @param next Next function for error handling.
   */
  static async acceptInvitation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      const acceptedHousehold = await householdService.acceptInvitation(
        householdId,
        userId
      );
      res.status(200).json(acceptedHousehold);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rejects a household invitation.
   * @param req Authenticated request containing invitation token.
   * @param res Response with the rejected invitation.
   * @param next Next function for error handling.
   */
  static async rejectInvitation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new UnauthorizedError("Unauthorized");
      }

      await householdService.rejectInvitation(householdId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
