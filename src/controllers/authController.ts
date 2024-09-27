import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/authService';
import { UnauthorizedError } from '../middlewares/errorHandler';

/**
 * AuthController handles user authentication processes.
 */
export class AuthController {
  /**
   * Registers a new user.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;
      const user = await AuthService.register(userData);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs in an existing user.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const tokens = await AuthService.login(email, password);
      
      const { user, accessToken, refreshToken } = tokens; 

      res
        .cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh-token',
        })
        .status(200)
        .json({ data: { user, accessToken } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out a user by clearing the refresh token cookie.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (userId) {
        await AuthService.logout(userId);
      }
      res
        .clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh-token',
        })
        .status(200)
        .json({ data: { message: 'Logged out successfully.' } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async refreshToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided.');
      }
      const tokens = await AuthService.refreshToken(refreshToken);
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = tokens; 



      res
        .cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh-token',
        })
        .status(200)
        .json({ data: { accessToken: newAccessToken } });
    } catch (error) {
      next(error);
    }
  }
}