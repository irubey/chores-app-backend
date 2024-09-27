import prisma from '../config/database';
import { RegisterUserDTO, TokenPayload } from '../types';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../middlewares/errorHandler';
import authConfig from '../config/auth';

/**
 * Generates an access token.
 * @param payload - The token payload.
 * @returns The signed JWT access token.
 */
function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, authConfig.jwt.accessSecret, { expiresIn: authConfig.jwt.accessTokenExpiration });
}

/**
 * Generates a refresh token.
 * @param payload - The token payload.
 * @returns The signed JWT refresh token.
 */
function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, authConfig.jwt.refreshSecret, { expiresIn: authConfig.jwt.refreshTokenExpiration });
}

/**
 * AuthService handles the business logic for authentication.
 */
export class AuthService {
  /**
   * Registers a new user.
   * @param userData - The registration data.
   * @returns The created user without the password hash.
   * @throws UnauthorizedError if email already exists.
   */
  static async register(userData: RegisterUserDTO) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new UnauthorizedError('Email already in use.');
    }

    const hashedPassword = await hash(userData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Logs in a user by verifying credentials and issuing tokens.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns The access and refresh tokens along with user data.
   * @throws UnauthorizedError if credentials are invalid.
   */
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const payload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Optionally, store refreshToken in DB or blacklist old tokens

    return { user, accessToken, refreshToken }; // Return user along with tokens
  }

  /**
   * Logs out a user by invalidating the refresh token.
   * @param userId - The ID of the user to log out.
   * @returns void
   * @throws Error if logout fails.
   */
  static async logout(userId: string) {
    // To implement: Invalidate refresh tokens, if stored in DB
    // e.g., prisma.refreshToken.deleteMany({ where: { userId } });
    // For simplicity, assuming stateless tokens that are cleared on client side
    return;
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * @param refreshToken - The refresh token.
   * @returns New access and refresh tokens.
   * @throws UnauthorizedError if refresh token is invalid or expired.
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwt.refreshSecret) as TokenPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      if (!user) {
        throw new UnauthorizedError('Invalid refresh token.');
      }

      const newPayload: TokenPayload = { userId: user.id, email: user.email };
      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      // Optionally, invalidate the old refresh token and store the new one

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }
  }
}