import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthService } from '../services/authService';
import { logError } from '../utils/logger';
import { AppError } from './errorHandler';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../types';

/**
 * Authentication middleware to protect routes.
 */
const authMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new AppError('No token provided', 401);
    }

    const decoded = AuthService.verifyAccessToken(accessToken);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Assign user to request object
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    logError('Authentication failed', error as Error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default authMiddleware;