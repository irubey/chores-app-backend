import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { config } from '../config/auth';
import { OAuthProvider } from '@prisma/client';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(config.google.clientId);

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