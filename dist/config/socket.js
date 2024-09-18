"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const tokenUtils_1 = require("../utils/tokenUtils");
const logger_1 = __importDefault(require("../utils/logger"));
const initializeSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    // Middleware for authentication
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        const token = socket.handshake.auth.token;
        if (!token) {
            logger_1.default.warn('Socket authentication failed: No token provided');
            return next(new Error('Authentication error'));
        }
        try {
            const user = yield (0, tokenUtils_1.verifyToken)(token);
            if (!user) {
                throw new Error('Invalid token');
            }
            socket.user = user;
            logger_1.default.info(`Socket authenticated for user: ${user.userId}`);
            next();
        }
        catch (error) {
            logger_1.default.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    }));
    io.on('connection', (socket) => {
        const authenticatedSocket = socket;
        logger_1.default.info(`User connected: ${authenticatedSocket.user.userId}`);
        // Join household room
        authenticatedSocket.on('join_household', (householdId) => {
            authenticatedSocket.join(`household:${householdId}`);
            logger_1.default.info(`User ${authenticatedSocket.user.userId} joined household ${householdId}`);
        });
        // Leave household room
        authenticatedSocket.on('leave_household', (householdId) => {
            authenticatedSocket.leave(`household:${householdId}`);
            logger_1.default.info(`User ${authenticatedSocket.user.userId} left household ${householdId}`);
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
            logger_1.default.info(`User disconnected: ${authenticatedSocket.user.userId}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
exports.default = exports.initializeSocket;
