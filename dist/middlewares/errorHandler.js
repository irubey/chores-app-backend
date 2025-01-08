"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.UnauthorizedError = exports.NotFoundError = exports.BadRequestError = exports.errorHandler = exports.AppError = void 0;
exports.createAuthError = createAuthError;
const logger_1 = __importDefault(require("../utils/logger"));
// Define the AppError class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = 500;
    let isOperational = false;
    // Check if the error is an instance of AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        isOperational = err.isOperational;
    }
    // Log error
    logger_1.default.error('Request failed', {
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
exports.errorHandler = errorHandler;
// Helper function to create an AuthError
function createAuthError(message, statusCode = 401) {
    const error = new AppError(message, statusCode);
    error.name = 'AuthError';
    return error;
}
class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message) {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
