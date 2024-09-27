import dotenv from 'dotenv';
dotenv.config();
const authConfig = {
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        accessTokenExpiration: '15m',
        refreshTokenExpiration: '7d',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID || '',
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
    },
    apple: {
        clientId: process.env.APPLE_CLIENT_ID || '',
        teamId: process.env.APPLE_TEAM_ID || '',
        keyId: process.env.APPLE_KEY_ID || '',
        privateKey: process.env.APPLE_PRIVATE_KEY || '',
        callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3000/api/auth/apple/callback',
    },
    passwordReset: {
        tokenExpiration: '1h',
    },
    sessionCookie: {
        name: 'choresapp.sid',
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
};
export default authConfig;
