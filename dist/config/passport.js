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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const prisma_1 = __importDefault(require("../prisma")); // Import Prisma Client
// Google OAuth Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user = yield prisma_1.default.user.findUnique({
            where: { oauth_id: profile.id },
        });
        if (!user) {
            user = yield prisma_1.default.user.create({
                data: {
                    oauth_id: profile.id,
                    oauth_provider: 'google',
                    name: profile.displayName,
                    email: profile.emails[0].value,
                },
            });
        }
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
})));
// Facebook OAuth Strategy
passport_1.default.use(new passport_facebook_1.Strategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails'],
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let user = yield prisma_1.default.user.findUnique({
            where: { oauth_id: profile.id },
        });
        if (!user) {
            user = yield prisma_1.default.user.create({
                data: {
                    oauth_id: profile.id,
                    oauth_provider: 'facebook',
                    name: profile.displayName,
                    email: profile.emails[0].value,
                },
            });
        }
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
})));
// Apple OAuth Strategy
// passport.use(
//   new AppleStrategy(
//     {
//       clientID: process.env.APPLE_CLIENT_ID!,
//       teamID: process.env.APPLE_TEAM_ID!,
//       keyID: process.env.APPLE_KEY_ID!,
//       privateKeyLocation: process.env.PRIVATE_KEY,
//       passReqToCallback: true,
//       callbackURL: '/auth/apple/callback',
//     },
//     async (accessToken: string, refreshToken: string, profile: any, done: any) => {
//       try {
//         let user = await prisma.user.findUnique({
//           where: { oauth_id: profile.id },
//         });
//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               oauth_id: profile.id,
//               oauth_provider: 'apple',
//               name: profile.displayName,
//               email: profile.email,
//             },
//           });
//         }
//         done(null, user);
//       } catch (error) {
//         done(error, null);
//       }
//     }
//   )
// );
// Serialize user ID to session
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from session
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id },
        });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
}));
exports.default = passport_1.default;
