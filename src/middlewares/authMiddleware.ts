import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { logError } from '../utils/logger';
import { AppError } from './errorHandler';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../types';

const authMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const accessToken = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;

    if (!accessToken) {
      throw new AppError('No token provided', 401);
    }

    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      throw new AppError('Invalid or expired access token', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Cast req to AuthenticatedRequest to assign user
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