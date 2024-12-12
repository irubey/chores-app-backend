import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { prismaExtensions } from './prismaExtensions';

// Define types for Prisma events
type PrismaLogEvent = {
  timestamp: Date;
  message: string;
  target: string;
};

type PrismaQueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

// Initialize base Prisma Client with logging
const basePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

// Set up event listeners before extending
if (process.env.NODE_ENV === 'development') {
  basePrisma.$on('query', (e: PrismaQueryEvent) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Params: ' + e.params);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

basePrisma.$on('error', (e: PrismaLogEvent) => {
  logger.error('Prisma Error: ' + e.message);
});

// Apply extensions after setting up listeners
const prisma = basePrisma.$extends(prismaExtensions);

// Export the type of our extended client
export type ExtendedPrismaClient = typeof prisma;

// Function to connect to the database
export const connectDatabase = async (): Promise<void> => {
  try {
    await basePrisma.$connect();
    logger.info('Successfully connected to the database');
  } catch (error) {
    logger.error('Failed to connect to the database', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

// Function to disconnect from the database
export const disconnectDatabase = async (): Promise<void> => {
  await basePrisma.$disconnect();
  logger.info('Disconnected from the database');
};

export default prisma;
