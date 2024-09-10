import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient, OAuthProvider } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

export const config = {
  jwtSecret: process.env.JWT_SECRET,
  google: {
    clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
    clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.BACKEND_URL}/auth/callback/google`,
  },
  facebook: {
    appId: process.env.OAUTH_FACEBOOK_CLIENT_ID,
    appSecret: process.env.OAUTH_FACEBOOK_CLIENT_SECRET,
    redirectUri: `${process.env.BACKEND_URL}/auth/callback/facebook`,
  },
  apple: {
    clientId: process.env.OAUTH_APPLE_CLIENT_ID,
    teamId: process.env.OAUTH_APPLE_TEAM_ID,
    keyId: process.env.OAUTH_APPLE_KEY_ID,
    privateKeyLocation: process.env.OAUTH_APPLE_PRIVATE_KEY_LOCATION,
    redirectUri: `${process.env.BACKEND_URL}/auth/callback/apple`,
  },
};

export const generateToken = (userId: string) => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: '1d',
  });
};

export const verifyGoogleToken = async (idToken: string) => {
  const client = new OAuth2Client(config.google.clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid token');
  }
  return {
    email: payload.email!,
    name: payload.name || null,
    sub: payload.sub,
  };
};

export const verifyAppleToken = async (idToken: string) => {
  const payload = await appleSignin.verifyIdToken(idToken, {
    audience: config.apple.clientId,
    ignoreExpiration: true,
  });
  return {
    email: payload.email!,
    name: null,
    sub: payload.sub,
  };
};

export const findOrCreateUser = async (email: string, name: string | null, provider: string, sub: string) => {
  let user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        name: name || email.split('@')[0],
        oauth_provider: provider as OAuthProvider,
        oauth_id: sub,
      },
    });
  }

  return user;
};

export const getCurrentUser = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
};

export const exchangeGoogleCode = async (code: string) => {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    redirect_uri: config.google.redirectUri,
    grant_type: 'authorization_code',
  });
  return data;
};

export const exchangeFacebookCode = async (code: string) => {
  // Implement Facebook code exchange
  throw new Error('Facebook code exchange not implemented');
};

export const exchangeAppleCode = async (code: string) => {
  // Implement Apple code exchange
  throw new Error('Apple code exchange not implemented');
};

export const getUserData = async (provider: string, tokenData: any) => {
  switch (provider) {
    case 'google':
      return getGoogleUserData(tokenData.access_token);
    case 'facebook':
      return getFacebookUserData(tokenData.access_token);
    case 'apple':
      return getAppleUserData(tokenData.id_token);
    default:
      throw new Error('Unsupported provider');
  }
};

const getGoogleUserData = async (accessToken: string) => {
  const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { id: data.id, email: data.email, name: data.name };
};

const getFacebookUserData = async (accessToken: string) => {
  const { data } = await axios.get('https://graph.facebook.com/me', {
    params: { fields: 'id,email,name', access_token: accessToken },
  });
  return { id: data.id, email: data.email, name: data.name };
};

const getAppleUserData = async (idToken: string) => {
  // Implement Apple user data retrieval
  // This involves decoding and verifying the ID token
  throw new Error('Apple user data retrieval not implemented');
};

export const generateState = () => {
  return crypto.randomBytes(32).toString('hex');
};

