/**
 * Validation Middleware
 *
 * @param schema - Joi validation schema
 * @returns Middleware function
 */
export const validate = (schema) => {
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
