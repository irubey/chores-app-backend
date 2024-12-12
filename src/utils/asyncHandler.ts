// backend/src/utils/asyncHandler.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Wraps an async function and passes errors to Express's error handler.
 *
 * @param fn - Async function to wrap
 * @returns Express RequestHandler
 */
export function asyncHandler<T = unknown, R = unknown>(
  fn: (
    req: AuthenticatedRequest<T>,
    res: Response,
    next: NextFunction
  ) => Promise<R>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest<T>, res, next)).catch(next);
  };
}
