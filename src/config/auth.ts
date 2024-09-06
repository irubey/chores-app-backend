import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
  },
  jwtSecret: process.env.JWT_SECRET,
} as const;

export const generateToken = (userId: string) => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: '1d',
  });
};

