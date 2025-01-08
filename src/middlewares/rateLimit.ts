import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import logger from "../utils/logger";

// Define rate limit options based on environment
const getRateLimitOptions = () => {
  if (process.env.NODE_ENV === "test") {
    return {
      windowMs: 1 * 1000, // 1 second
      max: 1000, // Much higher limit for tests
      standardHeaders: true,
      legacyHeaders: false,
      message: "Too many requests, please try again later.",
    };
  }

  // Production/Development rate limit options
  return {
    windowMs: 0.5 * 60 * 1000, // 30 seconds
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  };
};

// Create rate limiter with environment-specific options
const limiter = rateLimit(getRateLimitOptions());

// Middleware function
const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip rate limiting entirely in test environment for specific endpoints
  if (process.env.NODE_ENV === "test" && req.path.startsWith("/api/auth")) {
    return next();
  }

  // Apply rate limiting to all routes except those starting with /public
  if (!req.path.startsWith("/public")) {
    return limiter(req, res, next);
  }
  next();
};

export default rateLimitMiddleware;
