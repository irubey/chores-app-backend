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
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
const database_1 = __importDefault(require("../config/database"));
const passwordUtils_1 = require("../utils/passwordUtils");
const tokenUtils_1 = require("../utils/tokenUtils");
const errors_1 = require("../utils/errors");
function register(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashedPassword = yield (0, passwordUtils_1.hashPassword)(data.password);
        const user = yield database_1.default.user.create({
            data: Object.assign(Object.assign({}, data), { password: hashedPassword }),
        });
        return user;
    });
}
function login(credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield database_1.default.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isPasswordValid = yield (0, passwordUtils_1.comparePassword)(credentials.password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const accessToken = (0, tokenUtils_1.generateAccessToken)(user);
        const refreshToken = (0, tokenUtils_1.generateRefreshToken)(user);
        // Store refresh token in the database
        yield database_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        };
    });
}
function refreshToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payload = (0, tokenUtils_1.verifyRefreshToken)(token);
            const storedToken = yield database_1.default.refreshToken.findUnique({
                where: { token },
                include: { user: true },
            });
            if (!storedToken || storedToken.userId !== payload.id) {
                throw new errors_1.UnauthorizedError('Invalid refresh token');
            }
            const accessToken = (0, tokenUtils_1.generateAccessToken)(storedToken.user);
            return accessToken;
        }
        catch (error) {
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
    });
}
function logout(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield database_1.default.refreshToken.deleteMany({
            where: { userId },
        });
    });
}
