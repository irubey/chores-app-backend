import { Response, NextFunction, Request } from 'express';
import { UnauthorizedError } from './errorHandler';
import logger from '../utils/logger';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import { transformUser } from '../utils/transformers/userTransformer';

// Auth endpoints that don't require any token
const PUBLIC_AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    logger.debug('Auth tokens received', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      path: req.path,
      method: req.method,
    });

    // Handle auth endpoints specially
    if (req.path.startsWith('/api/auth/')) {
      // Public endpoints - no auth needed
      if (PUBLIC_AUTH_ENDPOINTS.includes(req.path)) {
        return next();
      }

      // Refresh token endpoint - only needs refresh token
      if (req.path === '/api/auth/refresh-token') {
        if (!refreshToken) {
          logger.debug('No refresh token provided for refresh endpoint');
          throw new UnauthorizedError('No refresh token provided');
        }
        return next();
      }

      // Logout endpoint - proceed even with invalid tokens
      if (req.path === '/api/auth/logout') {
        // If we have an access token and it's valid, attach the user
        if (accessToken) {
          try {
            const tokenPayload = await AuthService.verifyAccessToken(
              accessToken
            );
            if (tokenPayload?.userId) {
              const user = await prisma.user.findUnique({
                where: { id: tokenPayload.userId },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  profileImageURL: true,
                  createdAt: true,
                  updatedAt: true,
                  deletedAt: true,
                  activeHouseholdId: true,
                },
              });
              if (user && !user.deletedAt) {
                (req as AuthenticatedRequest).user = transformUser(user);
              }
            }
          } catch (error) {
            // Ignore errors for logout - we'll clear tokens anyway
            logger.debug('Token validation failed during logout', {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        return next();
      }

      // Change password endpoint - requires valid auth
      if (req.path === '/api/auth/change-password') {
        // Fall through to normal auth flow
      }
    }

    // For all other endpoints, require valid authentication
    if (!accessToken && !refreshToken) {
      logger.debug('No tokens provided');
      throw new UnauthorizedError('Authentication required');
    }

    // Try access token first if available
    if (accessToken) {
      try {
        logger.debug('Attempting to verify access token');
        const tokenPayload = await AuthService.verifyAccessToken(accessToken);

        if (!tokenPayload?.userId) {
          logger.debug('Invalid access token payload');
          throw new UnauthorizedError('Invalid access token');
        }

        const user = await prisma.user.findUnique({
          where: { id: tokenPayload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            profileImageURL: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            activeHouseholdId: true,
          },
        });

        if (!user || user.deletedAt) {
          logger.debug('User not found or deleted', {
            userId: tokenPayload.userId,
            deletedAt: user?.deletedAt,
          });
          throw new UnauthorizedError('User not found or deleted');
        }

        logger.debug('User authenticated via access token', {
          userId: user.id,
        });

        (req as AuthenticatedRequest).user = transformUser(user);
        return next();
      } catch (error) {
        logger.debug('Access token verification failed, attempting refresh', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Try refresh token if access token failed or wasn't present
    if (refreshToken) {
      try {
        logger.debug('Attempting token refresh');
        const refreshResult = await AuthService.refreshToken(refreshToken, res);
        const { accessToken: newAccessToken } = refreshResult.data;

        if (!newAccessToken) {
          logger.debug('Token refresh failed - no new access token');
          throw new UnauthorizedError('Token refresh failed');
        }

        const tokenPayload = await AuthService.verifyAccessToken(
          newAccessToken
        );
        if (!tokenPayload?.userId) {
          logger.debug('Invalid new access token payload');
          throw new UnauthorizedError('Invalid access token after refresh');
        }

        const user = await prisma.user.findUnique({
          where: { id: tokenPayload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            profileImageURL: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            activeHouseholdId: true,
          },
        });

        if (!user || user.deletedAt) {
          logger.debug('User not found or deleted after refresh', {
            userId: tokenPayload.userId,
            deletedAt: user?.deletedAt,
          });
          throw new UnauthorizedError('User not found or deleted');
        }

        logger.debug('User authenticated via refresh token', {
          userId: user.id,
        });

        (req as AuthenticatedRequest).user = transformUser(user);
        return next();
      } catch (error) {
        logger.debug('Refresh token verification failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        AuthService.clearAuthCookies(res);
        throw new UnauthorizedError('Session expired. Please login again.');
      }
    }

    logger.debug('Authentication failed - no valid tokens available');
    throw new UnauthorizedError('Authentication failed');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      AuthService.clearAuthCookies(res);
      return res.status(401).json({
        status: 'error',
        message: error.message,
      });
    }

    logger.error('Unexpected error in auth middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
