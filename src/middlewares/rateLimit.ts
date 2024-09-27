import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis'; // Corrected to default import
import Redis from 'ioredis';
import { logError } from '../utils/logger';

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT as string || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

// Define a type for the sendCommand function based on rate-limit-redis's SendCommandFn
type SendCommandFn = (command: string, ...args: Array<string | number | Buffer>) => Promise<any>;

// Define rate limit options
const rateLimitOptions = {
  windowMs: .5 * 60 * 1000, // 30 seconds 
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // Define the sendCommand function with explicit types
    sendCommand: (async (command: string, ...args: Array<string | number | Buffer>) => {
      try {
        // Explicitly cast args to the expected types
        return await redisClient.call(command, ...args) as any;
      } catch (error) {
        logError('Redis command error', error as Error);
        throw error;
      }
    }) as SendCommandFn, // Cast to SendCommandFn to satisfy type requirements
  }),
  message: 'Too many requests, please try again later.',
};

// Create rate limiter
const limiter = rateLimit(rateLimitOptions);

// Middleware function
const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Apply rate limiting to all routes except those starting with /public
  if (!req.path.startsWith('/public')) {
    return limiter(req, res, next);
  }
  next();
};

export default rateLimitMiddleware;
