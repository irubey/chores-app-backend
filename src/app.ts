import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import router from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean) as string[],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware for logging
app.use(morgan('combined'));

// Middleware for parsing JSON
app.use(express.json());

// Routes
app.use('/api', router);

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Chore Management API!');
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
