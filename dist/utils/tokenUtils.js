"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromHeader = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Load environment variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
/**
 * Generate an access JWT token for a user
 */
const generateAccessToken = (user, expiresIn = JWT_EXPIRATION) => {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_ACCESS_SECRET, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate a refresh JWT token for a user
 */
const generateRefreshToken = (user, expiresIn = JWT_REFRESH_EXPIRATION) => {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify and decode an access JWT token
 */
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
    }
    catch (error) {
        console.error('Access token verification failed:', error);
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verify and decode a refresh JWT token
 */
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    catch (error) {
        console.error('Refresh token verification failed:', error);
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Extract the token from the Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
