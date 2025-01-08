"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const socketAuthMiddleware_1 = __importDefault(require("../middlewares/socketAuthMiddleware"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3001',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Apply authentication middleware
    io.use(socketAuthMiddleware_1.default);
    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (userId) {
            socket.join(`user_${userId}`);
            logger_1.default.info(`User ${userId} connected and joined room user_${userId}`);
        }
        socket.on('disconnect', () => {
            if (userId) {
                logger_1.default.info(`User ${userId} disconnected`);
            }
        });
        // Additional event listeners can be added here
    });
    logger_1.default.info('Socket.IO server initialized');
};
exports.initializeSocket = initializeSocket;
/**
 * Getter to access the Socket.IO Server instance.
 * Throws an error if the server hasn't been initialized.
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};
exports.getIO = getIO;
