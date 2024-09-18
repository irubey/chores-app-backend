"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.generateRefreshToken = exports.extractTokenFromHeader = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
/**
 * Generate a JWT token for a user
 * @param user The user object
 * @returns The generated JWT token
 */
const generateToken = (user, expiresIn = JWT_EXPIRATION) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
};
exports.generateToken = generateToken;
/**
 * Verify and decode a JWT token
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Extract the token from the Authorization header
 * @param authHeader The Authorization header value
 * @returns The extracted token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
/**
 * Generate a refresh token for a user
 * @param user The user object
 * @returns The generated refresh token
 */
const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify a refresh token
 * @param refreshToken The refresh token to verify
 * @returns The decoded token payload or null if invalid
 */
const verifyRefreshToken = (refreshToken) => {
    try {
        return jsonwebtoken_1.default.verify(refreshToken, JWT_SECRET);
    }
    catch (error) {
        console.error('Refresh token verification failed:', error);
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
