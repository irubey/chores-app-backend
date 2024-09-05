import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';

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

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).send('Something broke - error log from middleware!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
