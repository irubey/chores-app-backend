import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log queries in development environment
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Log errors
prisma.$on('error', (e) => {
  logger.error('Prisma Error: ' + e.message);
});

// Function to connect to the database
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to the database');
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

// Function to disconnect from the database
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Disconnected from the database');
};

export default prisma;