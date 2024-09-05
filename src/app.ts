import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import router from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware for logging
app.use(morgan('combined'));

// Middleware for parsing JSON
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Chore Management API!');
});

// POST route example
app.post('/some-endpoint', (req, res) => {
  const data = req.body; // Access the JSON payload
  res.json({ receivedData: data });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

app.use('/api', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
