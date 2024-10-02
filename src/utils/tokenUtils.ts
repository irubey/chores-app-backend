import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

// Load environment variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate an access JWT token for a user
 */
export const generateAccessToken = (user: User, expiresIn: string = JWT_EXPIRATION): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn });
};

/**
 * Generate a refresh JWT token for a user
 */
export const generateRefreshToken = (user: User, expiresIn: string = JWT_REFRESH_EXPIRATION): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
};

/**
 * Verify and decode an access JWT token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
};

/**
 * Verify and decode a refresh JWT token
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
};

/**
 * Extract the token from the Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};