import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { AuthService } from "../services/authService";
import { UnauthorizedError } from "../middlewares/errorHandler";
import { LoginCredentials, RegisterUserDTO } from "@shared/types";

/**
 * AuthController handles user authentication processes.
 */
export class AuthController {
  /**
   * Registers a new user.
   */
  static async register(
    req: AuthenticatedRequest & { body: RegisterUserDTO },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData = req.body;
      const response = await AuthService.register(userData);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs in an existing user.
   */
  static async login(
    req: AuthenticatedRequest & { body: LoginCredentials },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthService.login(req.body, res);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out a user by clearing the refresh token cookie.
   */
  static async logout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response = await AuthService.logout(res);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  static async refreshToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError("No refresh token provided.");
      }
      const response = await AuthService.refreshToken(refreshToken, res);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
