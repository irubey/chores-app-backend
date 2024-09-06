import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    
    if (error) {
      const errorMessage = error.details.map((detail: Joi.ValidationErrorItem) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    
    // If validation passes, update req.body with the validated and sanitized data
    req.body = schema.validate(req.body, { stripUnknown: true }).value;
    
    next();
  };
};