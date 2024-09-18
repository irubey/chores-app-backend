import Joi from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Validation Middleware
 * 
 * @param schema - Joi validation schema
 * @returns Middleware function
 */
export const validate = (schema: Joi.ObjectSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errorMessage } });
    }

    next();
  };
};