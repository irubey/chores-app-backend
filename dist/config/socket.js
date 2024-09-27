import { Server } from 'socket.io';
import { verifyToken } from '../utils/tokenUtils';
import logger from '../utils/logger';
export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Middleware for authentication
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            logger.warn('Socket authentication failed: No token provided');
            return next(new Error('Authentication error'));
        }
        try {
            const user = await verifyToken(token);
            if (!user) {
                throw new Error('Invalid token');
            }
            socket.user = user;
            logger.info(`Socket authenticated for user: ${user.userId}`);
            next();
        }
        catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const authenticatedSocket = socket;
        logger.info(`User connected: ${authenticatedSocket.user.userId}`);
        // Join household room
        authenticatedSocket.on('join_household', (householdId) => {
            authenticatedSocket.join(`household:${householdId}`);
            logger.info(`User ${authenticatedSocket.user.userId} joined household ${householdId}`);
        });
        // Leave household room
        authenticatedSocket.on('leave_household', (householdId) => {
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
