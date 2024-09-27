import { Server } from 'socket.io';
import socketAuthMiddleware from '../middlewares/socketAuthMiddleware';
import dotenv from 'dotenv';
import logger from '../utils/logger';
dotenv.config();
let io;
export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Adjust as needed for security
        },
    });
    // Apply authentication middleware
    io.use(socketAuthMiddleware);
    io.on('connection', (socket) => {
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
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};
