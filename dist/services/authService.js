"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.verifyMembership = verifyMembership;
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../middlewares/errorHandler");
const auth_1 = __importDefault(require("../config/auth"));
const userTransformer_1 = require("../utils/transformers/userTransformer");
const ms_1 = __importDefault(require("ms"));
const logger_1 = __importDefault(require("../utils/logger"));
const householdTransformer_1 = require("../utils/transformers/householdTransformer");
/**
 * AuthService handles the business logic for authentication.
 */
class AuthService {
    static generateAccessToken(payload) {
        if (!payload.userId || !payload.email) {
            logger_1.default.error("Invalid token payload", { payload });
            throw new errorHandler_1.UnauthorizedError("Invalid token payload");
        }
        return jsonwebtoken_1.default.sign(payload, auth_1.default.jwt.accessSecret, {
            expiresIn: auth_1.default.jwt.accessTokenExpiration,
        });
    }
    static generateRefreshToken(payload) {
        if (!payload.userId || !payload.email) {
            logger_1.default.error("Invalid token payload", { payload });
            throw new errorHandler_1.UnauthorizedError("Invalid token payload");
        }
        const nonce = Math.random().toString(36).substring(2);
        const tokenPayload = { ...payload, nonce };
        return jsonwebtoken_1.default.sign(tokenPayload, auth_1.default.jwt.refreshSecret, {
            expiresIn: auth_1.default.jwt.refreshTokenExpiration,
        });
    }
    static verifyToken(token, secret) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger_1.default.error("Token verification failed", { error: error.message });
                throw new errorHandler_1.UnauthorizedError("Invalid token");
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                logger_1.default.error("Token expired", { error: error.message });
                throw new errorHandler_1.UnauthorizedError("Token expired");
            }
            if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
                logger_1.default.error("Token not yet valid", { error: error.message });
                throw new errorHandler_1.UnauthorizedError("Token not yet valid");
            }
            // For any other unexpected errors
            logger_1.default.error("Unexpected token verification error", { error });
            throw new errorHandler_1.UnauthorizedError("Token verification failed");
        }
    }
    static generateSessionId() {
        return Math.random().toString(36).substring(2);
    }
    static setAuthCookies(res, accessToken, refreshToken) {
        const cookieOptions = {
            httpOnly: process.env.COOKIE_HTTP_ONLY !== "false",
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: process.env.COOKIE_SAME_SITE || "lax",
            path: "/",
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
        // Convert JWT time strings to milliseconds
        const accessExpMs = (0, ms_1.default)(auth_1.default.jwt.accessTokenExpiration);
        const refreshExpMs = (0, ms_1.default)(auth_1.default.jwt.refreshTokenExpiration);
        // Generate a unique session ID for this auth session
        const sessionId = this.generateSessionId();
        logger_1.default.debug("Setting auth cookies", {
            accessExpMs,
            refreshExpMs,
            cookieOptions,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
                COOKIE_SECURE: process.env.COOKIE_SECURE,
                COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
                COOKIE_HTTP_ONLY: process.env.COOKIE_HTTP_ONLY,
            },
        });
        // Set auth_session cookie that can be read by frontend
        res.cookie("auth_session", sessionId, {
            ...cookieOptions,
            httpOnly: false, // Allow JS to read this cookie
            maxAge: refreshExpMs, // Same expiry as refresh token
        });
        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: accessExpMs,
        });
        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: refreshExpMs,
        });
        return sessionId;
    }
    static clearAuthCookies(res) {
        const cookieOptions = {
            httpOnly: process.env.COOKIE_HTTP_ONLY !== "false",
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: process.env.COOKIE_SAME_SITE || "lax",
            path: "/",
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
        logger_1.default.debug("Clearing auth cookies", {
            cookieOptions,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
                COOKIE_SECURE: process.env.COOKIE_SECURE,
                COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
                COOKIE_HTTP_ONLY: process.env.COOKIE_HTTP_ONLY,
            },
        });
        // Clear auth_session cookie
        res.clearCookie("auth_session", cookieOptions);
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
    }
    static async register(userData, res) {
        logger_1.default.debug("Registering new user", { email: userData.email });
        const existingUser = await database_1.default.user.findUnique({
            where: { email: userData.email },
        });
        if (existingUser) {
            logger_1.default.warn("Registration failed - email in use", {
                email: userData.email,
            });
            throw new errorHandler_1.UnauthorizedError("Email already in use.");
        }
        const hashedPassword = await (0, bcryptjs_1.hash)(userData.password, 10);
        const user = await database_1.default.user.create({
            data: {
                email: userData.email,
                passwordHash: hashedPassword,
                name: userData.name,
                activeHouseholdId: null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                profileImageURL: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                activeHouseholdId: true,
            },
        });
        // Generate tokens
        const payload = { userId: user.id, email: user.email };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        // Store refresh token
        await database_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + (0, ms_1.default)(auth_1.default.jwt.refreshTokenExpiration)),
            },
        });
        // Set auth cookies
        this.setAuthCookies(res, accessToken, refreshToken);
        logger_1.default.info("User registered successfully", { userId: user.id });
        return wrapResponse((0, userTransformer_1.transformUser)(user));
    }
    static async login(credentials, res) {
        logger_1.default.debug("Login attempt", { email: credentials.email });
        const user = await database_1.default.user.findUnique({
            where: { email: credentials.email },
            select: {
                id: true,
                email: true,
                name: true,
                profileImageURL: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                passwordHash: true,
                activeHouseholdId: true,
            },
        });
        if (!user || !user.passwordHash) {
            logger_1.default.warn("Login failed - user not found", {
                email: credentials.email,
            });
            throw new errorHandler_1.UnauthorizedError("Invalid credentials.");
        }
        const isPasswordValid = await (0, bcryptjs_1.compare)(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
            logger_1.default.warn("Login failed - invalid password", { userId: user.id });
            throw new errorHandler_1.UnauthorizedError("Invalid credentials.");
        }
        const payload = { userId: user.id, email: user.email };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        await database_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + (0, ms_1.default)(auth_1.default.jwt.refreshTokenExpiration)),
            },
        });
        this.setAuthCookies(res, accessToken, refreshToken);
        logger_1.default.info("User logged in successfully", { userId: user.id });
        const { passwordHash: _, ...userWithoutPassword } = user;
        return wrapResponse((0, userTransformer_1.transformUser)(userWithoutPassword));
    }
    static async logout(res) {
        this.clearAuthCookies(res);
        return wrapResponse(undefined);
    }
    static async refreshToken(refreshToken, res) {
        logger_1.default.debug("Token refresh attempt");
        // Verify token before database operations
        const decoded = this.verifyToken(refreshToken, auth_1.default.jwt.refreshSecret);
        // Use transaction for atomicity
        return await database_1.default.$transaction(async (tx) => {
            const existingToken = await tx.refreshToken.findUnique({
                where: { token: refreshToken },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            deletedAt: true,
                        },
                    },
                },
            });
            if (!existingToken || existingToken.revoked) {
                logger_1.default.warn("Token refresh failed - invalid token", {
                    userId: decoded.userId,
                });
                throw new errorHandler_1.UnauthorizedError("Invalid refresh token");
            }
            if (!existingToken.user || existingToken.user.deletedAt) {
                logger_1.default.warn("Token refresh failed - invalid user", {
                    userId: existingToken.user?.id,
                    deletedAt: existingToken.user?.deletedAt,
                });
                throw new errorHandler_1.UnauthorizedError("Invalid user account");
            }
            // Create new tokens
            const newPayload = {
                userId: existingToken.user.id,
                email: existingToken.user.email,
            };
            const newAccessToken = this.generateAccessToken(newPayload);
            const newRefreshToken = this.generateRefreshToken(newPayload);
            // Revoke old token and create new one atomically
            await tx.refreshToken.update({
                where: { id: existingToken.id },
                data: { revoked: true },
            });
            await tx.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: existingToken.user.id,
                    expiresAt: new Date(Date.now() + (0, ms_1.default)(auth_1.default.jwt.refreshTokenExpiration)),
                },
            });
            const sessionId = this.setAuthCookies(res, newAccessToken, newRefreshToken);
            logger_1.default.info("Token refresh successful", {
                userId: existingToken.user.id,
            });
            return wrapResponse({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                sessionId,
            });
        });
    }
    static verifyAccessToken(accessToken) {
        return this.verifyToken(accessToken, auth_1.default.jwt.accessSecret);
    }
}
exports.AuthService = AuthService;
async function verifyMembership(householdId, userId, requiredRoles) {
    const membership = await database_1.default.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership ||
        !requiredRoles.includes(membership.role) ||
        !membership.isAccepted ||
        membership.isRejected ||
        membership.leftAt !== null) {
        throw new errorHandler_1.UnauthorizedError("Access denied.");
    }
    return (0, householdTransformer_1.transformMembership)(membership);
}
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return {
        data,
        status: 200,
    };
}
