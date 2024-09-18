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
exports.userService = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const tokenUtils_1 = require("../utils/tokenUtils");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
exports.userService = {
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield prisma.user.findUnique({ where: { email: userData.email } });
            if (existingUser) {
                throw new errors_1.BadRequestError('User with this email already exists');
            }
            const newUser = yield prisma.user.create({
                data: Object.assign(Object.assign({}, userData), { password: userData.password ? yield (0, auth_1.hashPassword)(userData.password) : undefined }),
            });
            return newUser;
        });
    },
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.user.findUnique({ where: { id: userId } });
        });
    },
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.user.findUnique({ where: { email } });
        });
    },
    updateUser(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const updatedUser = yield prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
            return updatedUser;
        });
    },
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma.user.delete({ where: { id: userId } });
        });
    },
    getUserPreferences(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.userPreference.findUnique({ where: { userId } });
        });
    },
    updateUserPreferences(userId, preferences) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingPreferences = yield prisma.userPreference.findUnique({ where: { userId } });
            if (existingPreferences) {
                return prisma.userPreference.update({
                    where: { userId },
                    data: preferences,
                });
            }
            else {
                return prisma.userPreference.create({
                    data: Object.assign(Object.assign({}, preferences), { userId }),
                });
            }
        });
    },
    authenticateUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma.user.findUnique({ where: { email } });
            if (!user || !user.password) {
                return null;
            }
            const isPasswordValid = yield (0, auth_1.comparePasswords)(password, user.password);
            if (!isPasswordValid) {
                return null;
            }
            const token = (0, tokenUtils_1.generateToken)(user);
            return { user, token };
        });
    },
    getUserHouseholds(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.householdMember.findMany({
                where: { userId },
                include: { household: true },
            });
        });
    },
    getUserBadges(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.userBadge.findMany({
                where: { userId },
                include: { badge: true },
            });
        });
    },
    addUserBadge(userId, badgeId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.userBadge.create({
                data: {
                    userId,
                    badgeId,
                },
            });
        });
    },
    findOrCreateOAuthUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield prisma.user.findUnique({
                where: { oauthId: userData.oauthId },
            });
            if (!user) {
                user = yield prisma.user.create({
                    data: Object.assign(Object.assign({}, userData), { role: 'MEMBER' }),
                });
            }
            return user;
        });
    },
    findUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.user.findUnique({
                where: { id },
            });
        });
    },
};
exports.default = exports.userService;
