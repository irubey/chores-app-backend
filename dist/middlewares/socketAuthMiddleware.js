"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database")); // Use centralized Prisma client
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger")); // Use logger for better debugging
dotenv_1.default.config();
/**
 * Middleware to authenticate Socket.IO connections using JWT.
 * @param socket - The socket instance.
 * @param next - Callback to proceed to the next middleware or emit an error.
 */
const socketAuthMiddleware = async (socket, next) => {
    let token = socket.handshake.auth.token || '';
    console.log('Received token:', token);
    if (!token) {
        logger_1.default.warn('Authentication error: Token not provided');
        return next(new Error('Authentication error: Token not provided'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        const user = await database_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            logger_1.default.warn('Authentication error: User not found');
            return next(new Error('Authentication error: User not found'));
        }
        socket.user = user;
        // Join household rooms
        const householdMembers = await database_1.default.householdMember.findMany({
            where: { userId: user.id },
            select: { householdId: true },
        });
        householdMembers.forEach((member) => {
            socket.join(`household_${member.householdId}`);
            logger_1.default.info(`User ${user.id} joined household_${member.householdId}`);
        });
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication error: Invalid token', { error });
        console.error('JWT verification error:', error);
        return next(new Error('Authentication error: Invalid token'));
    }
};
exports.default = socketAuthMiddleware;
