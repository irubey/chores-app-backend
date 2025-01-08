"use strict";
// import passport from 'passport';
// import {
//   Strategy as GoogleStrategy,
//   Profile as GoogleProfile,
// } from 'passport-google-oauth20';
// import {
//   Strategy as FacebookStrategy,
//   Profile as FacebookProfile,
// } from 'passport-facebook';
// import { Strategy as AppleStrategy } from 'passport-apple';
// import { User } from '@prisma/client';
// import { findOrCreateOAuthUser } from '../services/userService';
// import authConfig from './auth';
// import logger from '../utils/logger';
// /**
//  * Initializes Passport strategies for Google, Facebook, and Apple OAuth.
//  */
// export const initializePassport = () => {
//   // Google OAuth Strategy
//   passport.use(
//     new GoogleStrategy(
//       {
//         clientID: authConfig.google.clientId,
//         clientSecret: authConfig.google.clientSecret,
//         callbackURL: authConfig.google.callbackURL,
//       },
//       async (
//         accessToken: string,
//         refreshToken: string,
//         profile: GoogleProfile,
//         done: (error: any, user?: any) => void
//       ) => {
//         try {
//           const user = await findOrCreateOAuthUser.findOrCreate({
//             oauthProvider: 'GOOGLE',
//             oauthId: profile.id,
//             name: profile.displayName || '',
//             email:
//               profile.emails && profile.emails[0]?.value
//                 ? profile.emails[0].value
//                 : '',
//           });
//           return done(null, user);
//         } catch (error) {
//           logger.error('Error in Google OAuth strategy:', error);
//           return done(error, false);
//         }
//       }
//     )
//   );
//   // Facebook OAuth Strategy
//   passport.use(
//     new FacebookStrategy(
//       {
//         clientID: authConfig.facebook.clientId,
//         clientSecret: authConfig.facebook.clientSecret,
//         callbackURL: authConfig.facebook.callbackURL,
//         profileFields: ['id', 'displayName', 'email'],
//       },
//       async (
//         accessToken: string,
//         refreshToken: string,
//         profile: FacebookProfile,
//         done: (error: any, user?: any) => void
//       ) => {
//         try {
//           const user = await findOrCreateOAuthUser.findOrCreate({
//             oauthProvider: 'FACEBOOK',
//             oauthId: profile.id,
//             name: profile.displayName || '',
//             email:
//               profile.emails && profile.emails[0]?.value
//                 ? profile.emails[0].value
//                 : '',
//           });
//           return done(null, user);
//         } catch (error) {
//           logger.error('Error in Facebook OAuth strategy:', error);
//           return done(error, false);
//         }
//       }
//     )
//   );
//   // Apple OAuth Strategy
//   passport.use(
//     new AppleStrategy(
//       {
//         clientID: authConfig.apple.clientId,
//         teamID: authConfig.apple.teamId,
//         keyID: authConfig.apple.keyId,
//         privateKeyString: authConfig.apple.privateKey,
//         callbackURL: authConfig.apple.callbackURL,
//         passReqToCallback: true,
//       },
//       async (
//         req: any,
//         accessToken: string,
//         refreshToken: string,
//         idToken: any,
//         profile: any,
//         done: (error: any, user?: any) => void
//       ) => {
//         try {
//           const { sub: appleId, email } = idToken;
//           const user = await findOrCreateOAuthUser.findOrCreate({
//             oauthProvider: 'APPLE',
//             oauthId: appleId,
//             name: email ? email.split('@')[0] : '',
//             email: email || '',
//           });
//           return done(null, user);
//         } catch (error) {
//           logger.error('Error in Apple OAuth strategy:', error);
//           return done(error, false);
//         }
//       }
//     )
//   );
// };
// export default passport;
