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
      if (accessToken) {
        const decoded = AuthService.verifyAccessToken(accessToken);
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
        (req as AuthenticatedRequest).user = transformUser(user);
        return next();
      }
    } catch (accessError) {
      // Access token invalid or expired, try refresh
      if (refreshToken) {
        try {
          await AuthService.refreshToken(refreshToken, res);
          // Retry the original request after token refresh
          return next();
        } catch (refreshError) {
          throw new AppError("Authentication failed", 401);
        }
      }
    }

    throw new AppError("Authentication failed", 401);
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
