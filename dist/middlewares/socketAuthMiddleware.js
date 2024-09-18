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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const socketAuthMiddleware = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (!token) {
        return next(new Error('Authentication error: Token not provided'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }
        socket.user = user;
        next();
    }
    catch (error) {
        return next(new Error('Authentication error: Invalid token'));
    }
});
exports.default = socketAuthMiddleware;
