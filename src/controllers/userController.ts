import { Response, NextFunction, response } from 'express';
import * as userService from '../services/userService';
import { UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';
import { UpdateUserDTO } from '@shared/types';

/**
 * UserController handles all user-related operations such as registration, login, and household management.
 */
export class UserController {
  /**
   * Retrieves the profile of the authenticated user.
   * @param req Authenticated Express Request object
   * @param res Express Response object with user profile data
   * @param next Express NextFunction for error handling
   */
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const response = await userService.getUserProfile(req.user.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the profile of the authenticated user.
   * @param req Authenticated Express Request object
   * @param res Express Response object with updated user data
   * @param next Express NextFunction for error handling
   */
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }

      const updateData: UpdateUserDTO = {
        name: req.body.name,
        profileImageURL: req.body.profileImageURL,
      };

      const response = await userService.updateUserProfile(
        req.user.id,
        updateData
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
