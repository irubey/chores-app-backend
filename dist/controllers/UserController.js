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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const userService_1 = require("../services/userService");
const badgeService_1 = require("../services/badgeService");
const validationSchemas_1 = require("../utils/validationSchemas");
const logger_1 = require("../utils/logger");
class UserController {
    // Get user profile
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const user = yield userService_1.userService.getUserProfile(userId);
                res.json(user);
            }
            catch (error) {
                logger_1.logger.error('Error fetching user profile:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Update user profile
    updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const { error, value } = (0, validationSchemas_1.validateUserUpdate)(req.body);
                if (error) {
                    return res.status(400).json({ error: error.details[0].message });
                }
                const updatedUser = yield userService_1.userService.updateUserProfile(userId, value);
                res.json(updatedUser);
            }
            catch (error) {
                logger_1.logger.error('Error updating user profile:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Get user preferences
    getPreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const preferences = yield userService_1.userService.getUserPreferences(userId);
                res.json(preferences);
            }
            catch (error) {
                logger_1.logger.error('Error fetching user preferences:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Update user preferences
    updatePreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const { error, value } = (0, validationSchemas_1.validatePreferences)(req.body);
                if (error) {
                    return res.status(400).json({ error: error.details[0].message });
                }
                const updatedPreferences = yield userService_1.userService.updateUserPreferences(userId, value);
                res.json(updatedPreferences);
            }
            catch (error) {
                logger_1.logger.error('Error updating user preferences:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Get user badges
    getBadges(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const badges = yield badgeService_1.badgeService.getUserBadges(userId);
                res.json(badges);
            }
            catch (error) {
                logger_1.logger.error('Error fetching user badges:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Get all available badges
    getAllBadges(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const badges = yield badgeService_1.badgeService.getAllBadges();
                res.json(badges);
            }
            catch (error) {
                logger_1.logger.error('Error fetching all badges:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Delete user account
    deleteAccount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                yield userService_1.userService.deleteUserAccount(userId);
                res.status(204).send();
            }
            catch (error) {
                logger_1.logger.error('Error deleting user account:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
