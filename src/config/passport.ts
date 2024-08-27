import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
// import AppleStrategy from 'passport-apple';
import prisma from '../prisma'; // Import Prisma Client

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await prisma.user.findUnique({
          where: { oauth_id: profile.id },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              oauth_id: profile.id,
              oauth_provider: 'google',
              name: profile.displayName,
              email: profile.emails[0].value,
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: '/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await prisma.user.findUnique({
          where: { oauth_id: profile.id },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              oauth_id: profile.id,
              oauth_provider: 'facebook',
              name: profile.displayName,
              email: profile.emails[0].value,
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

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
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
