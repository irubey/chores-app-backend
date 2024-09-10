import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { config } from '../config/auth';
import { OAuthProvider } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

// TODO add specific development bypass for local development

export const verifyGoogleToken = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
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

export const generateToken = (userId: string) => {
  if (!config.jwtSecret) {
    throw new Error('JWT secret is not defined');
  }
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: '1d',
  });
};

export const getCurrentUser = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
};

const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

export const exchangeGoogleCode = async (code: string) => {
  // Implement Google code exchange
};

export const exchangeFacebookCode = async (code: string) => {
  // Implement Facebook code exchange
};

export const exchangeAppleCode = async (code: string) => {
  // Implement Apple code exchange
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
};

export const generateState = () => {
  return crypto.randomBytes(32).toString('hex');
};