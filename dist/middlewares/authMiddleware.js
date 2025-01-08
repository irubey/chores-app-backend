"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const authService_1 = require("../services/authService");
const database_1 = __importDefault(require("../config/database"));
const userTransformer_1 = require("../utils/transformers/userTransformer");
// Auth endpoints that don't require any token
const PUBLIC_AUTH_ENDPOINTS = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/verify-email",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
];
const authMiddleware = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;
        logger_1.default.debug("Auth tokens received", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            path: req.path,
            method: req.method,
        });
        // Handle auth endpoints specially
        if (req.path.startsWith("/api/auth/")) {
            // Public endpoints - no auth needed
            if (PUBLIC_AUTH_ENDPOINTS.includes(req.path)) {
                return next();
            }
            // Refresh token endpoint - only needs refresh token
            if (req.path === "/api/auth/refresh-token") {
                if (!refreshToken) {
                    logger_1.default.debug("No refresh token provided for refresh endpoint");
                    throw new errorHandler_1.UnauthorizedError("No refresh token provided");
                }
                return next();
            }
            // Logout endpoint - proceed even with invalid tokens
            if (req.path === "/api/auth/logout") {
                // If we have an access token and it's valid, attach the user
                if (accessToken) {
                    try {
                        const tokenPayload = await authService_1.AuthService.verifyAccessToken(accessToken);
                        if (tokenPayload?.userId) {
                            const user = await database_1.default.user.findUnique({
                                where: { id: tokenPayload.userId },
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
                            if (user && !user.deletedAt) {
                                req.user = (0, userTransformer_1.transformUser)(user);
                            }
                        }
                    }
                    catch (error) {
                        // Ignore errors for logout - we'll clear tokens anyway
                        logger_1.default.debug("Token validation failed during logout", {
                            error: error instanceof Error ? error.message : "Unknown error",
                        });
                    }
                }
                return next();
            }
            // Change password endpoint - requires valid auth
            if (req.path === "/api/auth/change-password") {
                // Fall through to normal auth flow
            }
        }
        // For all other endpoints, require valid authentication
        if (!accessToken && !refreshToken) {
            logger_1.default.debug("No tokens provided");
            throw new errorHandler_1.UnauthorizedError("Authentication required");
        }
        // Try access token first if available
        if (accessToken) {
            try {
                logger_1.default.debug("Attempting to verify access token");
                const tokenPayload = await authService_1.AuthService.verifyAccessToken(accessToken);
                if (!tokenPayload?.userId) {
                    logger_1.default.debug("Invalid access token payload");
                    throw new errorHandler_1.UnauthorizedError("Invalid access token");
                }
                const user = await database_1.default.user.findUnique({
                    where: { id: tokenPayload.userId },
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
                if (!user || user.deletedAt) {
                    logger_1.default.debug("User not found or deleted", {
                        userId: tokenPayload.userId,
                        deletedAt: user?.deletedAt,
                    });
                    throw new errorHandler_1.UnauthorizedError("User not found or deleted");
                }
                logger_1.default.debug("User authenticated via access token", {
                    userId: user.id,
                });
                req.user = (0, userTransformer_1.transformUser)(user);
                return next();
            }
            catch (error) {
                logger_1.default.debug("Access token verification failed, attempting refresh", {
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        logger_1.default.debug("Authentication failed - no valid tokens available");
        throw new errorHandler_1.UnauthorizedError("Authentication failed");
    }
    catch (error) {
        if (error instanceof errorHandler_1.UnauthorizedError) {
            authService_1.AuthService.clearAuthCookies(res);
            return res.status(401).json({
                status: "error",
                message: error.message,
            });
        }
        logger_1.default.error("Unexpected error in auth middleware", {
            error: error instanceof Error ? error.message : "Unknown error",
            path: req.path,
        });
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
};
exports.authMiddleware = authMiddleware;
