"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
/**
 * Validation Middleware
 *
 * @param schema - Joi validation schema
 * @returns Middleware function
 */
const validate = (schema) => {
    return async (req, res, next) => {
        const authReq = req;
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errorMessage } });
        }
        next();
    };
};
exports.validate = validate;
