"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
// Initialize Redis client
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});
// Define rate limit options based on environment
const getRateLimitOptions = () => {
    if (process.env.NODE_ENV === 'test') {
        return {
            windowMs: 1 * 1000, // 1 second
            max: 1000, // Much higher limit for tests
            standardHeaders: true,
            legacyHeaders: false,
            store: new rate_limit_redis_1.default({
                sendCommand: (async (command, ...args) => {
                    try {
                        return (await redisClient.call(command, ...args));
                    }
                    catch (error) {
                        logger_1.default.error('Redis command error', { error });
                        throw error;
                    }
                }),
            }),
            message: 'Too many requests, please try again later.',
        };
    }
    // Production/Development rate limit options
    return {
        windowMs: 0.5 * 60 * 1000, // 30 seconds
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        store: new rate_limit_redis_1.default({
            sendCommand: (async (command, ...args) => {
                try {
                    return (await redisClient.call(command, ...args));
                }
                catch (error) {
                    logger_1.default.error('Redis command error', { error });
                    throw error;
                }
            }),
        }),
        message: 'Too many requests, please try again later.',
    };
};
// Create rate limiter with environment-specific options
const limiter = (0, express_rate_limit_1.default)(getRateLimitOptions());
// Middleware function
const rateLimitMiddleware = (req, res, next) => {
    // Skip rate limiting entirely in test environment for specific endpoints
    if (process.env.NODE_ENV === 'test' && req.path.startsWith('/api/auth')) {
        return next();
    }
    // Apply rate limiting to all routes except those starting with /public
    if (!req.path.startsWith('/public')) {
        return limiter(req, res, next);
    }
    next();
};
exports.default = rateLimitMiddleware;
