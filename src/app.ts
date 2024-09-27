import express from 'express';
import passport from './config/passport';
import {initializeSocket} from './sockets';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import rateLimitMiddleware from './middlewares/rateLimit';
import { connectDatabase } from './config/database';
import routes from './routes';
import logger from './utils/logger';
import { initializeJobs } from './jobs';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Connect to the database
connectDatabase();

// Middleware Setup

// Rate Limiting Middleware
app.use(rateLimitMiddleware);

// CORS Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api', routes);

// Error Handling Middleware (should be after other middleware and routes)
app.use(errorHandler);

// Initialize Scheduled Jobs
initializeJobs();

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
