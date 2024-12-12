import dotenv from 'dotenv';

dotenv.config();

const authConfig = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback',
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    callbackURL:
      process.env.FACEBOOK_CALLBACK_URL ||
      'http://localhost:3000/api/auth/facebook/callback',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    callbackURL:
      process.env.APPLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/apple/callback',
  },
  passwordReset: {
    tokenExpiration: '1h',
  },
};

export default authConfig;
