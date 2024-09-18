import { Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * UserController handles all user-related operations such as registration, login, and household management.
 */
export class UserController {
  /**
   * Registers a new user.
   * @param req Express Request object containing user registration data
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const user = await userService.registerUser({ email, password, name });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs in an existing user.
   * @param req Express Request object containing login credentials
   * @param res Express Response object with authentication tokens
   * @param next Express NextFunction for error handling
   */
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const tokens = await userService.loginUser({ email, password });
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves the profile of the authenticated user.
   * @param req Authenticated Express Request object
   * @param res Express Response object with user profile data
   * @param next Express NextFunction for error handling
   */
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const user = await userService.getUserProfile(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new household.
   * @param req Authenticated Express Request object containing household data
   * @param res Express Response object with created household data
   * @param next Express NextFunction for error handling
   */
  static async createHousehold(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { name } = req.body;
      const household = await userService.createHousehold({ name }, req.user.id);
      res.status(201).json(household);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds a new member to a household.
   * @param req Authenticated Express Request object containing member data
   * @param res Express Response object with updated household data
   * @param next Express NextFunction for error handling
   */
  static async addMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId } = req.params;
      const { userId, role } = req.body;
      const household = await userService.addMemberToHousehold(householdId, userId, role, req.user.id);
      res.status(200).json(household);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes a member from a household.
   * @param req Authenticated Express Request object containing member ID
   * @param res Express Response object with updated household data
   * @param next Express NextFunction for error handling
   */
  static async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, memberId } = req.params;
      await userService.removeMemberFromHousehold(householdId, memberId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates household details.
   * @param req Authenticated Express Request object containing updated household data
   * @param res Express Response object with updated household data
   * @param next Express NextFunction for error handling
   */
  static async updateHousehold(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId } = req.params;
      const updateData = req.body;
      const updatedHousehold = await userService.updateHousehold(householdId, updateData, req.user.id);
      res.status(200).json(updatedHousehold);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a household.
   * @param req Authenticated Express Request object containing household ID
   * @param res Express Response object with no content
   * @param next Express NextFunction for error handling
   */
  static async deleteHousehold(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId } = req.params;
      await userService.deleteHousehold(householdId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}