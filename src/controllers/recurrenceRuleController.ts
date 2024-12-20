import { Response, NextFunction } from "express";
import * as recurrenceRuleService from "../services/recurrenceRuleService";
import { UnauthorizedError } from "../middlewares/errorHandler";
import { AuthenticatedRequest } from "../types";
import {
  CreateRecurrenceRuleDTO,
  UpdateRecurrenceRuleDTO,
} from "@shared/types";

/**
 * RecurrenceRuleController handles all CRUD operations related to recurrence rules.
 */
export class RecurrenceRuleController {
  /**
   * Lists all recurrence rules.
   */
  public static async listRecurrenceRules(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const response = await recurrenceRuleService.listRecurrenceRules();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new recurrence rule.
   */
  public static async createRecurrenceRule(
    req: AuthenticatedRequest<CreateRecurrenceRuleDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const response = await recurrenceRuleService.createRecurrenceRule(
        req.body
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a recurrence rule by ID.
   */
  public static async getRecurrenceRule(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { ruleId } = req.params;

      if (!ruleId) {
        throw new Error("Missing required parameter: ruleId");
      }

      const response = await recurrenceRuleService.getRecurrenceRule(ruleId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing recurrence rule.
   */
  public static async updateRecurrenceRule(
    req: AuthenticatedRequest<UpdateRecurrenceRuleDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { ruleId } = req.params;

      if (!ruleId) {
        throw new Error("Missing required parameter: ruleId");
      }

      const response = await recurrenceRuleService.updateRecurrenceRule(
        ruleId,
        req.body
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a recurrence rule.
   */
  public static async deleteRecurrenceRule(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { ruleId } = req.params;

      if (!ruleId) {
        throw new Error("Missing required parameter: ruleId");
      }

      await recurrenceRuleService.deleteRecurrenceRule(ruleId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
