import logger from '../utils/logger';
// Define the AppError class
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = 500;
    let isOperational = false;
    // Check if the error is an instance of AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        isOperational = err.isOperational;
    }
    // Log error
    logger.error({
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
    }
    else {
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
export function createAuthError(message, statusCode = 401) {
    const error = new AppError(message, statusCode);
    error.name = 'AuthError';
    return error;
}
export class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}
export class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}
export class UnauthorizedError extends AppError {
    constructor(message) {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}
