"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const errorHandler_1 = require("../middlewares/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * AuthController handles user authentication processes.
 */
class AuthController {
    /**
     * Registers a new user.
     */
    static async register(req, res, next) {
        try {
            const userData = req.body;
            const response = await authService_1.AuthService.register(userData, res);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logs in an existing user.
     */
    static async login(req, res, next) {
        try {
            const response = await authService_1.AuthService.login(req.body, res);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logs out a user by clearing the refresh token cookie.
     */
    static async logout(req, res, next) {
        try {
            await authService_1.AuthService.logout(res);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refreshes the access token using a valid refresh token.
     */
    static async refreshToken(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                logger_1.default.debug("No refresh token in cookies");
                throw new errorHandler_1.UnauthorizedError("No refresh token provided.");
            }
            logger_1.default.debug("Attempting token refresh", {
                hasRefreshToken: true,
                cookies: Object.keys(req.cookies),
            });
            await authService_1.AuthService.refreshToken(refreshToken, res);
            logger_1.default.debug("Token refresh successful", {
                cookies: Object.keys(res.getHeaders()["set-cookie"] || []),
            });
            // Return a simple success response - tokens are in cookies
            res.status(200).json({ status: "success" });
        }
        catch (error) {
            logger_1.default.error("Token refresh failed", { error });
            next(error);
        }
    }
}
exports.AuthController = AuthController;
