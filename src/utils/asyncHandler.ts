// backend/src/utils/asyncHandler.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Wraps an async function and passes errors to Express's error handler.
 * 
 * @param fn - Async function to wrap
 * @returns Express RequestHandler
 */
export function asyncHandler(
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthenticatedRequest, res, next).catch(next);
  };
}