import { Server } from 'socket.io';
import http from 'http';
import socketAuthMiddleware from '../middlewares/socketAuthMiddleware';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import { AuthenticatedSocket } from '../middlewares/socketAuthMiddleware';
dotenv.config();

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} connected and joined room user_${userId}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        logger.info(`User ${userId} disconnected`);
      }
    });

    // Additional event listeners can be added here
  });

  logger.info('Socket.IO server initialized');
};

/**
 * Getter to access the Socket.IO Server instance.
 * Throws an error if the server hasn't been initialized.
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
