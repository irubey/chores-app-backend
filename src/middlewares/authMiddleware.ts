import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthService } from "../services/authService";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest } from "../types";
import { transformUser } from "../utils/transformers/userTransformer";
import prisma from "../config/database";

/**
 * Authentication middleware to protect routes.
 */
const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      throw new AppError("No tokens provided", 401);
    }

    try {
      // Verify access token
      const decoded = AuthService.verifyAccessToken(accessToken);

      // Get user with minimal fields
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      if (!user) throw new AppError("User not found", 401);

      // Transform user to match shared User interface
      (req as AuthenticatedRequest).user = transformUser(user);
      return next();
    } catch (error) {
      // Try to refresh the token if access token is invalid
      if (refreshToken) {
        try {
          await AuthService.refreshToken(refreshToken, res);
          // Token refresh successful, continue with request
          return next();
        } catch (refreshError) {
          // If refresh fails, throw authentication error
          throw new AppError("Authentication failed", 401);
        }
      }
      throw new AppError("Authentication failed", 401);
    }
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
