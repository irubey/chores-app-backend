import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate a JWT token for a user
 * @param user The user object
 * @returns The generated JWT token
 */
export const generateToken = (user: User, expiresIn: string = JWT_EXPIRATION): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT token
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Extract the token from the Authorization header
 * @param authHeader The Authorization header value
 * @returns The extracted token or null if not found
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

/**
 * Generate a refresh token for a user
 * @param user The user object
 * @returns The generated refresh token
 */
export const generateRefreshToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify a refresh token
 * @param refreshToken The refresh token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyRefreshToken = (refreshToken: string): TokenPayload | null => {
  try {
    return jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
};