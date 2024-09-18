"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis")); // Corrected to default import
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
// Initialize Redis client
const redisClient = new ioredis_1.default(process.env.REDIS_URL);
// Define rate limit options
const rateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new rate_limit_redis_1.default({
        // Define the sendCommand function with explicit types
        sendCommand: ((command, ...args) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Explicitly cast args to the expected types
                return yield redisClient.call(command, ...args);
            }
            catch (error) {
                (0, logger_1.logError)('Redis command error', error);
                throw error;
            }
        })), // Cast to SendCommandFn to satisfy type requirements
    }),
    message: 'Too many requests, please try again later.',
};
// Create rate limiter
const limiter = (0, express_rate_limit_1.default)(rateLimitOptions);
// Middleware function
const rateLimitMiddleware = (req, res, next) => {
    // Apply rate limiting to all routes except those starting with /public
    if (!req.path.startsWith('/public')) {
        return limiter(req, res, next);
    }
    next();
};
exports.default = rateLimitMiddleware;
