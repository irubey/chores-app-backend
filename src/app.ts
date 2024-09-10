import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import router from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import cors from 'cors';
import { CorsOptions } from 'cors';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in the environment variables');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3001'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS middleware before other routes
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

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
