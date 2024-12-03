import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthService } from "../services/authService";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest } from "../types";
import { transformUser } from "../utils/transformers/userTransformer";
import prisma from "../config/database";
import logger from "../utils/logger";

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

    logger.debug("Auth tokens received", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      path: req.path,
      method: req.method,
    });

    // Skip auth for refresh token endpoint
    if (req.path === "/api/auth/refresh-token") {
      if (!refreshToken) {
        logger.debug("No refresh token provided for refresh endpoint");
        throw new AppError("No refresh token provided", 401);
      }
      return next();
    }

    // If no tokens at all, fail immediately
    if (!accessToken && !refreshToken) {
      logger.debug("No tokens provided");
      throw new AppError("No tokens provided", 401);
    }

    // Try access token first if available
    if (accessToken) {
      try {
        logger.debug("Attempting to verify access token");
        const decoded = AuthService.verifyAccessToken(accessToken);
        logger.debug("Access token verification result", { decoded });

        if (!decoded || !decoded.userId) {
          logger.debug("Invalid access token payload");
          throw new AppError("Invalid access token", 401);
        }

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

        if (!user) {
          logger.debug("User not found with decoded token", {
            userId: decoded.userId,
          });
          throw new AppError("User not found", 401);
        }

        if (user.deletedAt) {
          logger.debug("Deleted user attempted access", {
            userId: user.id,
            deletedAt: user.deletedAt,
          });
          throw new AppError("Account has been deleted", 401);
        }

        logger.debug("User authenticated via access token", {
          userId: user.id,
        });
        (req as AuthenticatedRequest).user = transformUser(user);
        return next();
      } catch (accessError) {
        logger.debug(
          "Access token verification failed, will try refresh token",
          {
            error:
              accessError instanceof Error
                ? accessError.message
                : "Unknown error",
            stack: accessError instanceof Error ? accessError.stack : undefined,
          }
        );
      }
    }

    // Try refresh token if access token failed or wasn't present
    if (refreshToken) {
      try {
        logger.debug("Attempting token refresh");
        const refreshResult = await AuthService.refreshToken(refreshToken, res);
        logger.debug("Token refresh successful", {
          userId: refreshResult.data.userId,
        });

        if (!refreshResult.data || !refreshResult.data.userId) {
          logger.debug("Invalid refresh token response");
          throw new AppError("Invalid refresh token response", 401);
        }

        // Get user details after successful refresh
        const user = await prisma.user.findUnique({
          where: { id: refreshResult.data.userId },
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

        if (!user) {
          logger.debug("User not found after successful token refresh", {
            userId: refreshResult.data.userId,
          });
          throw new AppError("User not found", 401);
        }

        if (user.deletedAt) {
          logger.debug("Deleted user attempted refresh", {
            userId: user.id,
            deletedAt: user.deletedAt,
          });
          throw new AppError("Account has been deleted", 401);
        }

        logger.debug("User authenticated via refresh token", {
          userId: user.id,
        });
        (req as AuthenticatedRequest).user = transformUser(user);

        return next();
      } catch (refreshError) {
        logger.debug("Refresh token verification failed", {
          error:
            refreshError instanceof Error
              ? refreshError.message
              : "Unknown error",
          stack: refreshError instanceof Error ? refreshError.stack : undefined,
        });

        // Clear invalid cookies
        AuthService.clearAuthCookies(res);

        throw new AppError(
          refreshError instanceof Error
            ? refreshError.message
            : "Invalid refresh token",
          401
        );
      }
    }

    // If we get here, no valid tokens were found
    logger.debug("Authentication failed - no valid tokens available");
    throw new AppError("Authentication failed", 401);
  } catch (error) {
    // Log the full error details
    logger.error("Authentication middleware error", {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method,
    });

    // Clear cookies on auth errors
    if (error instanceof AppError && error.statusCode === 401) {
      AuthService.clearAuthCookies(res);
    }

    // Pass error to error handling middleware
    next(error);
  }
};

export default authMiddleware;
