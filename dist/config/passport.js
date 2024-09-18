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
exports.initializePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const passport_apple_1 = require("passport-apple");
const userService_1 = require("../services/userService");
const auth_1 = __importDefault(require("./auth"));
const logger_1 = __importDefault(require("../utils/logger"));
// Initialize Passport Strategies
const initializePassport = () => {
    // Google OAuth Strategy
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: auth_1.default.google.clientId,
        clientSecret: auth_1.default.google.clientSecret,
        callbackURL: '/api/auth/google/callback',
    }, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const user = yield userService_1.userService.findOrCreateOAuthUser({
                oauthProvider: 'GOOGLE',
                oauthId: profile.id,
                name: profile.displayName || '',
                email: profile.emails && ((_a = profile.emails[0]) === null || _a === void 0 ? void 0 : _a.value) ? profile.emails[0].value : '',
            });
            done(null, user);
        }
        catch (error) {
            logger_1.default.error('Error in Google OAuth strategy:', error);
            done(error);
        }
    })));
    // Facebook OAuth Strategy
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: auth_1.default.facebook.clientId,
        clientSecret: auth_1.default.facebook.clientSecret,
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email'],
    }, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const user = yield userService_1.userService.findOrCreateOAuthUser({
                oauthProvider: 'FACEBOOK',
                oauthId: profile.id,
                name: profile.displayName || '',
                email: profile.emails && ((_a = profile.emails[0]) === null || _a === void 0 ? void 0 : _a.value) ? profile.emails[0].value : '',
            });
            done(null, user);
        }
        catch (error) {
            logger_1.default.error('Error in Facebook OAuth strategy:', error);
            done(error);
        }
    })));
    // Apple OAuth Strategy
    passport_1.default.use(new passport_apple_1.Strategy({
        clientID: auth_1.default.apple.clientId,
        teamID: auth_1.default.apple.teamId,
        keyID: auth_1.default.apple.keyId,
        privateKeyLocation: auth_1.default.apple.privateKey,
        callbackURL: '/api/auth/apple/callback',
        passReqToCallback: true,
    }, (req, accessToken, refreshToken, idToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { sub: appleId, email } = idToken;
            const user = yield userService_1.userService.findOrCreateOAuthUser({
                oauthProvider: 'APPLE',
                oauthId: appleId,
                name: email ? email.split('@')[0] : '',
                email: email || '',
            });
            done(null, user);
        }
        catch (error) {
            logger_1.default.error('Error in Apple OAuth strategy:', error);
            done(error);
        }
    })));
    // Serialize User
    passport_1.default.serializeUser((user, done) => {
        if (user && user.id) {
            done(null, user.id);
        }
        else {
            logger_1.default.error('User serialization failed');
            done(new Error('User serialization failed'));
        }
    });
    // Deserialize User
    passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = yield userService_1.userService.findUserById(id);
            if (user) {
                done(null, user);
            }
            else {
                logger_1.default.warn(`User not found for id: ${id}`);
                done(null, false);
            }
        }
        catch (error) {
            logger_1.default.error('Error deserializing user:', error);
            done(error);
        }
    }));
};
exports.initializePassport = initializePassport;
exports.default = passport_1.default;
