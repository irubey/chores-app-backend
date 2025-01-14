import express from "express";
// import { initializeSocket } from "./sockets";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import rateLimitMiddleware from "./middlewares/rateLimit";
import { connectDatabase } from "./config/database";
import routes from "./routes";
import logger from "./utils/logger";
import { initializeJobs } from "./jobs";
import threadRoutes from "./routes/thread-routes";

//TODO: update routes to accept AbortController if greater efficiency is needed

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://hearth-frontend.vercel.app",
  "https://hearth-frontend-9zisd9ga9-isaacs-projects-4c3ee9fc.vercel.app",
  // Include localhost for development
  "http://localhost:3001",
  // Add wildcard for vercel preview deployments
  /^https:\/\/hearth-frontend.*\.vercel\.app$/
].filter(Boolean);

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check exact matches first
    if (allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      console.log(`Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// // Initialize Socket.io
// const io = initializeSocket(server);

// Connect to the database
connectDatabase();

// Middleware Setup

// Add this before other middleware
app.set("trust proxy", 1);

// Rate Limiting Middleware
app.use(rateLimitMiddleware);

// Body Parsers
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// Cookie Parser with secure settings
app.use(cookieParser(process.env.SESSION_SECRET));

// Initialize Passport
// app.use(passport.initialize());

// Routes
app.use("/api", routes);

// Error Handling Middleware (should be after other middleware and routes)
app.use(errorHandler);

// Initialize Scheduled Jobs
// initializeJobs();

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
