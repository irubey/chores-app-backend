"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService = __importStar(require("../services/userService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * UserController handles all user-related operations such as registration, login, and household management.
 */
class UserController {
    /**
     * Retrieves the profile of the authenticated user.
     * @param req Authenticated Express Request object
     * @param res Express Response object with user profile data
     * @param next Express NextFunction for error handling
     */
    static async getProfile(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const response = await userService.getUserProfile(req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates the profile of the authenticated user.
     * @param req Authenticated Express Request object
     * @param res Express Response object with updated user data
     * @param next Express NextFunction for error handling
     */
    static async updateProfile(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const updateData = {
                name: req.body.name,
                profileImageURL: req.body.profileImageURL,
                activeHouseholdId: req.body.activeHouseholdId,
            };
            // Remove undefined fields
            Object.keys(updateData).forEach((key) => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });
            const response = await userService.updateUserProfile(req.user.id, updateData);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
