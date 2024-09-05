// import { Profile as GoogleProfile, Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Profile as FacebookProfile, Strategy as FacebookStrategy } from 'passport-facebook';
// import passport from 'passport';
// import prisma from '../prisma'; // Import Prisma Client
// import { User } from '@prisma/client'; 

// // Google OAuth Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       callbackURL: '/auth/google/callback',
//     },
//     async (
//       accessToken: string,
//       refreshToken: string,
//       profile: GoogleProfile,
//       done: (error: any, user?: User) => void
//     ) => {
//       try {
//         let user = await prisma.user.findUnique({
//           where: { oauth_id: profile.id },
//         });

//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               oauth_id: profile.id,
//               oauth_provider: 'google',
//               name: profile.displayName || '',
//               email: profile.emails && profile.emails[0]?.value ? profile.emails[0].value : '',
//             },
//           });
//         }

//         done(null, user);
//       } catch (error) {
//         done(error);
//       }
//     }
//   )
// );

// // Facebook OAuth Strategy
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID!,
//       clientSecret: process.env.FACEBOOK_APP_SECRET!,
//       callbackURL: '/auth/facebook/callback',
//       profileFields: ['id', 'displayName', 'emails'],
//     },
//     async (
//       accessToken: string,
//       refreshToken: string,
//       profile: FacebookProfile,
//       done: (error: any, user?: User) => void
//     ) => {
//       try {
//         let user = await prisma.user.findUnique({
//           where: { oauth_id: profile.id },
//         });

//         if (!user) {
//           user = await prisma.user.create({
//             data: {
//               oauth_id: profile.id,
//               oauth_provider: 'facebook',
//               name: profile.displayName || '',
//               email: profile.emails && profile.emails[0]?.value ? profile.emails[0].value : '',
//             },
//           });
//         }

//         done(null, user);
//       } catch (error) {
//         done(error);
//       }
//     }
//   )
// );

// // Apple OAuth Strategy
// // Uncomment and configure as needed
// // passport.use(
// //   new AppleStrategy(
// //     {
// //       clientID: process.env.APPLE_CLIENT_ID!,
// //       teamID: process.env.APPLE_TEAM_ID!,
// //       keyID: process.env.APPLE_KEY_ID!,
// //       privateKeyLocation: process.env.PRIVATE_KEY!,
// //       passReqToCallback: true,
// //       callbackURL: '/auth/apple/callback',
// //     },
// //     async (
// //       accessToken: string,
// //       refreshToken: string,
// //       profile: any,
// //       done: (error: any, user?: User) => void
// //     ) => {
// //       try {
// //         let user = await prisma.user.findUnique({
// //           where: { oauth_id: profile.id },
// //         });

// //         if (!user) {
// //           user = await prisma.user.create({
// //             data: {
// //               oauth_id: profile.id,
// //               oauth_provider: 'apple',
// //               name: profile.displayName || '',
// //               email: profile.email || '',
// //             },
// //           });
// //         }

// //         done(null, user);
// //       } catch (error) {
// //         done(error);
// //       }
// //     }
// //   )
// // );

// passport.serializeUser((user: User, done: (error: any, id?: string) => void) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id: string, done: (error: any, user?: User | false | null) => void) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id },
//     });
//     done(null, user);
//   } catch (error) {
//     console.error('Deserialization Error:', error);
//     done(error);
//   }
// });

// export default passport;
