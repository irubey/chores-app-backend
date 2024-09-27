import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/tokenUtils';
import { User } from '@prisma/client';
import logger from '../utils/logger';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { TokenPayload } from '../types'; // Make sure to import TokenPayload

// Update the interface to use TokenPayload instead of User
interface AuthenticatedSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  user: TokenPayload;
}

export const initializeSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('Socket authentication failed: No token provided');
      return next(new Error('Authentication error'));
    }

    try {
      const user = await verifyAccessToken(token);
      if (!user) {
        throw new Error('Invalid token');
      }
      (socket as AuthenticatedSocket).user = user;
      logger.info(`Socket authenticated for user: ${user.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    logger.info(`User connected: ${authenticatedSocket.user.userId}`);

    // Join household room
    authenticatedSocket.on('join_household', (householdId: string) => {
      authenticatedSocket.join(`household:${householdId}`);
      logger.info(`User ${authenticatedSocket.user.userId} joined household ${householdId}`);
    });

    // Leave household room
    authenticatedSocket.on('leave_household', (householdId: string) => {
      authenticatedSocket.leave(`household:${householdId}`);
      logger.info(`User ${authenticatedSocket.user.userId} left household ${householdId}`);
    });

    // Handle real-time events
    authenticatedSocket.on('notification', (data) => {
      // Emit notification to the user
      io.to(`user:${authenticatedSocket.user.userId}`).emit('notification', data);
    });

    authenticatedSocket.on('chore_update', (data) => {
      // Emit chore update to the relevant household
      io.to(`household:${data.householdId}`).emit('chore_update', data);
    });

    authenticatedSocket.on('message', (data) => {
      // Emit message to the household
      io.to(`household:${data.householdId}`).emit('message', data);
    });

    authenticatedSocket.on('household_update', (data) => {
      // Emit household update to all members
      io.to(`household:${data.householdId}`).emit('household_update', data);
    });

    authenticatedSocket.on('disconnect', () => {
      logger.info(`User disconnected: ${authenticatedSocket.user.userId}`);
    });
  });

  return io;
};

export default initializeSocket;