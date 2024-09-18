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
exports.authMiddleware = void 0;
const tokenUtils_1 = require("../utils/tokenUtils");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("./errorHandler");
const database_1 = __importDefault(require("../config/database"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authReq = req;
    try {
        const authHeader = authReq.headers['authorization'];
        const accessToken = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;
        if (!accessToken) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        const decoded = (0, tokenUtils_1.verifyToken)(accessToken);
        if (decoded) {
            const user = yield database_1.default.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 401);
            }
            authReq.user = user;
            return next();
        }
        // If access token is invalid or expired, attempt to refresh
        const refreshToken = (_a = authReq.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (!refreshToken) {
            throw new errorHandler_1.AppError('No refresh token provided', 401);
        }
        const refreshPayload = (0, tokenUtils_1.verifyRefreshToken)(refreshToken);
        if (!refreshPayload) {
            throw new errorHandler_1.AppError('Invalid refresh token', 401);
        }
        const user = yield database_1.default.user.findUnique({ where: { id: refreshPayload.userId } });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 401);
        }
        // Generate new access token
        const newAccessToken = (0, tokenUtils_1.generateToken)(user);
        res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        authReq.user = user;
        // Implement token rotation
        const newRefreshToken = (0, tokenUtils_1.generateToken)(user, '7d');
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        next();
    }
    catch (error) {
        (0, logger_1.logError)('Authentication failed', error);
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
exports.authMiddleware = authMiddleware;
exports.default = exports.authMiddleware;
