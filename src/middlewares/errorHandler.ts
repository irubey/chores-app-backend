import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};

const handlePrismaError = (
  err: PrismaClientKnownRequestError,
  res: Response
) => {
  switch (err.code) {
    case 'P2002':
      return res.status(409).json({
        error: {
          message: 'Unique constraint violation',
          details: err.meta?.target,
        },
      });
    case 'P2025':
      return res.status(404).json({
        error: {
          message: 'Record not found',
        },
      });
    default:
      return res.status(500).json({
        error: {
          message: 'Database error',
          details: err.message,
        },
      });
  }
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
    },
  });
};