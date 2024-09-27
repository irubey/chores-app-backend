import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis'; // Corrected to default import
import Redis from 'ioredis';
import { logError } from '../utils/logger';
// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL);
// Define rate limit options
const rateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
        // Define the sendCommand function with explicit types
        sendCommand: (async (command, ...args) => {
            try {
                // Explicitly cast args to the expected types
                return await redisClient.call(command, ...args);
            }
            catch (error) {
                logError('Redis command error', error);
                throw error;
            }
        }), // Cast to SendCommandFn to satisfy type requirements
    }),
    message: 'Too many requests, please try again later.',
};
// Create rate limiter
const limiter = rateLimit(rateLimitOptions);
// Middleware function
const rateLimitMiddleware = (req, res, next) => {
    // Apply rate limiting to all routes except those starting with /public
    if (!req.path.startsWith('/public')) {
        return limiter(req, res, next);
    }
    next();
};
export default rateLimitMiddleware;
