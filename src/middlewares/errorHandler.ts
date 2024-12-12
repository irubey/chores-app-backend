import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Define the AppError class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Define a type for AuthError
export type AuthError = AppError & {
  name: 'AuthError';
};

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values
  let statusCode = 500;
  let isOperational = false;

  // Check if the error is an instance of AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    isOperational = err.isOperational;
  }

  // Log error
  logger.error('Request failed', {
    message: err.message,
    stack: err.stack,
    statusCode,
    isOperational,
    url: req.originalUrl,
    method: req.method,
  });

  // Determine if the error is a known operational error or an unknown error
  if (isOperational) {
    // Send error response for known operational errors
    res.status(statusCode).json({
      error: {
        code: statusCode,
        message: err.message,
      },
    });
  } else {
    // For unknown errors, send a generic error message
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal Server Error',
      },
    });
  }
};

// Helper function to create an AuthError
export function createAuthError(
  message: string,
  statusCode: number = 401
): AuthError {
  const error = new AppError(message, statusCode) as AuthError;
  error.name = 'AuthError';
  return error;
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
