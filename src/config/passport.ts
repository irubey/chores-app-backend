import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { Strategy as AppleStrategy } from 'passport-apple';
import { User } from '@prisma/client';
import { userService } from '../services/userService';
import config from './auth';
import logger from '../utils/logger';

// Initialize Passport Strategies
export const initializePassport = () => {
  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: '/api/auth/google/callback',
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: (error: any, user?: User) => void
      ) => {
        try {
          const user = await userService.findOrCreateOAuthUser({
            oauthProvider: 'GOOGLE',
            oauthId: profile.id,
            name: profile.displayName || '',
            email: profile.emails && profile.emails[0]?.value ? profile.emails[0].value : '',
          });
          done(null, user);
        } catch (error) {
          logger.error('Error in Google OAuth strategy:', error);
          done(error);
        }
      }
    )
  );

  // Facebook OAuth Strategy
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.facebook.clientId,
        clientSecret: config.facebook.clientSecret,
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: FacebookProfile,
        done: (error: any, user?: User) => void
      ) => {
        try {
          const user = await userService.findOrCreateOAuthUser({
            oauthProvider: 'FACEBOOK',
            oauthId: profile.id,
            name: profile.displayName || '',
            email: profile.emails && profile.emails[0]?.value ? profile.emails[0].value : '',
          });
          done(null, user);
        } catch (error) {
          logger.error('Error in Facebook OAuth strategy:', error);
          done(error);
        }
      }
    )
  );

  // Apple OAuth Strategy
  passport.use(
    new AppleStrategy(
      {
        clientID: config.apple.clientId,
        teamID: config.apple.teamId,
        keyID: config.apple.keyId,
        privateKeyLocation: config.apple.privateKey,
        callbackURL: '/api/auth/apple/callback',
        passReqToCallback: true,
      },
      async (
        req: any,
        accessToken: string,
        refreshToken: string,
        idToken: any,
        profile: any,
        done: (error: any, user?: User) => void
      ) => {
        try {
          const { sub: appleId, email } = idToken;
          const user = await userService.findOrCreateOAuthUser({
            oauthProvider: 'APPLE',
            oauthId: appleId,
            name: email ? email.split('@')[0] : '',
            email: email || '',
          });
          done(null, user);
        } catch (error) {
          logger.error('Error in Apple OAuth strategy:', error);
          done(error);
        }
      }
    )
  );

  // Serialize User
  passport.serializeUser((user: any, done) => {
    if (user && user.id) {
      done(null, user.id);
    } else {
      logger.error('User serialization failed');
      done(new Error('User serialization failed'));
    }
  });

  // Deserialize User
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userService.findUserById(id);
      if (user) {
        done(null, user);
      } else {
        logger.warn(`User not found for id: ${id}`);
        done(null, false);
      }
    } catch (error) {
      logger.error('Error deserializing user:', error);
      done(error);
    }
  });
};

export default passport;
