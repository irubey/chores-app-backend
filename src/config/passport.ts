import { Profile as GoogleProfile, Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Profile as FacebookProfile, Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as AppleStrategy } from 'passport-apple';
import passport from 'passport';
import { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { config } from './auth';

const prisma = new PrismaClient();

// Ensure required environment variables are set
if (!config.google.clientId || !config.google.clientSecret) {
  throw new Error('Google OAuth credentials are not properly configured');
}

if (!config.facebook.appId || !config.facebook.appSecret) {
  throw new Error('Facebook OAuth credentials are not properly configured');
}

if (!config.apple.clientId || !config.apple.teamId || !config.apple.keyId || !config.apple.privateKeyLocation) {
  throw new Error('Apple OAuth credentials are not properly configured');
}

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: '/auth/google/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: (error: any, user?: User) => void
    ) => {
      try {
        let user = await prisma.user.findUnique({
          where: { oauth_id: profile.id },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              oauth_id: profile.id,
              oauth_provider: 'GOOGLE',
              name: profile.displayName || '',
              email: profile.emails && profile.emails[0]?.value ? profile.emails[0].value : '',
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: config.facebook.appId,
      clientSecret: config.facebook.appSecret,
      callbackURL: '/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: FacebookProfile,
      done: (error: any, user?: User) => void
    ) => {
      try {
        let user = await prisma.user.findUnique({
          where: { oauth_id: profile.id },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              oauth_id: profile.id,
              oauth_provider: 'FACEBOOK',
              name: profile.displayName || '',
              email: profile.emails && profile.emails[0]?.value ? profile.emails[0].value : '',
            },
          });
        }

        done(null, user);
      } catch (error) {
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
      privateKeyLocation: config.apple.privateKeyLocation,
      callbackURL: '/auth/apple/callback',
      passReqToCallback: true, // Add this line
    },
    async (req: any, accessToken: string, refreshToken: string, idToken: any, profile: any, done: (error: any, user?: User) => void) => {
      try {
        const { sub: appleId, email } = idToken;
        let user = await prisma.user.findUnique({
          where: { oauth_id: appleId },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              oauth_id: appleId,
              oauth_provider: 'APPLE',
              name: email ? email.split('@')[0] : '',
              email: email || '',
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

// Define a custom User type that matches Passport's expectations
type PassportUser = {
  id: string;
  oauth_id: string;
  [key: string]: any;
};

function isPassportUser(user: any): user is PassportUser {
  return 'id' in user && 'oauth_id' in user;
}

passport.serializeUser((user: any, done: (error: any, id?: string) => void) => {
  if (isPassportUser(user)) {
    done(null, user.id || user.oauth_id);
  } else {
    done(new Error('Invalid user object'));
  }
});

passport.deserializeUser(async (id: string, done: (error: any, user?: User | false | null) => void) => {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id },
          { oauth_id: id }
        ]
      },
    });
    done(null, user);
  } catch (error) {
    console.error('Deserialization Error:', error);
    done(error);
  }
});

export default passport;
