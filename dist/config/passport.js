import passport from 'passport';
import { Strategy as GoogleStrategy, } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, } from 'passport-facebook';
import { Strategy as AppleStrategy } from 'passport-apple';
import { findOrCreateOAuthUser } from '../services/userService';
import authConfig from './auth';
import logger from '../utils/logger';
/**
 * Initializes Passport strategies for Google, Facebook, and Apple OAuth.
 */
export const initializePassport = () => {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: authConfig.google.clientId,
        clientSecret: authConfig.google.clientSecret,
        callbackURL: authConfig.google.callbackURL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateOAuthUser.findOrCreate({
                oauthProvider: 'GOOGLE',
                oauthId: profile.id,
                name: profile.displayName || '',
                email: profile.emails && profile.emails[0]?.value
                    ? profile.emails[0].value
                    : '',
            });
            return done(null, user);
        }
        catch (error) {
            logger.error('Error in Google OAuth strategy:', error);
            return done(error, false);
        }
    }));
    // Facebook OAuth Strategy
    passport.use(new FacebookStrategy({
        clientID: authConfig.facebook.clientId,
        clientSecret: authConfig.facebook.clientSecret,
        callbackURL: authConfig.facebook.callbackURL,
        profileFields: ['id', 'displayName', 'email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateOAuthUser.findOrCreate({
                oauthProvider: 'FACEBOOK',
                oauthId: profile.id,
                name: profile.displayName || '',
                email: profile.emails && profile.emails[0]?.value
                    ? profile.emails[0].value
                    : '',
            });
            return done(null, user);
        }
        catch (error) {
            logger.error('Error in Facebook OAuth strategy:', error);
            return done(error, false);
        }
    }));
    // Apple OAuth Strategy
    passport.use(new AppleStrategy({
        clientID: authConfig.apple.clientId,
        teamID: authConfig.apple.teamId,
        keyID: authConfig.apple.keyId,
        privateKeyString: authConfig.apple.privateKey,
        callbackURL: authConfig.apple.callbackURL,
        passReqToCallback: true,
    }, async (req, accessToken, refreshToken, idToken, profile, done) => {
        try {
            const { sub: appleId, email } = idToken;
            const user = await findOrCreateOAuthUser.findOrCreate({
                oauthProvider: 'APPLE',
                oauthId: appleId,
                name: email ? email.split('@')[0] : '',
                email: email || '',
            });
            return done(null, user);
        }
        catch (error) {
            logger.error('Error in Apple OAuth strategy:', error);
            return done(error, false);
        }
    }));
    // Serialize User
    passport.serializeUser((user, done) => {
        if (user && user.id) {
            done(null, user.id);
        }
        else {
            logger.error('User serialization failed');
            done(new Error('User serialization failed'));
        }
    });
    // Deserialize User
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await findOrCreateOAuthUser.getUserById(id);
            if (user) {
                done(null, user);
            }
            else {
                logger.warn(`User not found for id: ${id}`);
                done(null, false);
            }
        }
        catch (error) {
            logger.error('Error deserializing user:', error);
            done(error, false);
        }
    });
};
export default passport;
