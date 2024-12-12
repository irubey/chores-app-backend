import prisma from '../config/database';
import { TokenPayload } from '@backendTypes/index';
import { RegisterUserDTO, LoginCredentials } from '@shared/types/user';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../middlewares/errorHandler';
import authConfig from '../config/auth';
import { Response } from 'express';
import { HouseholdRole } from '@shared/enums';
import { HouseholdMember } from '@shared/types/household';
import { transformUser } from '../utils/transformers/userTransformer';
import { User } from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import ms from 'ms';
import logger from '../utils/logger';
import { ExtendedPrismaClient } from '../config/database';
import { transformMembership } from '../utils/transformers/householdTransformer';

type TransactionClient = Omit<
  ExtendedPrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * AuthService handles the business logic for authentication.
 */
export class AuthService {
  public static generateAccessToken(payload: TokenPayload): string {
    if (!payload.userId || !payload.email) {
      logger.error('Invalid token payload', { payload });
      throw new UnauthorizedError('Invalid token payload');
    }
    return jwt.sign(payload, authConfig.jwt.accessSecret, {
      expiresIn: authConfig.jwt.accessTokenExpiration,
    });
  }

  public static generateRefreshToken(payload: TokenPayload): string {
    if (!payload.userId || !payload.email) {
      logger.error('Invalid token payload', { payload });
      throw new UnauthorizedError('Invalid token payload');
    }
    const nonce = Math.random().toString(36).substring(2);
    const tokenPayload = { ...payload, nonce };
    return jwt.sign(tokenPayload, authConfig.jwt.refreshSecret, {
      expiresIn: authConfig.jwt.refreshTokenExpiration,
    });
  }

  private static verifyToken(token: string, secret: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Token verification failed', { error: error.message });
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        logger.error('Token expired', { error: error.message });
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        logger.error('Token not yet valid', { error: error.message });
        throw new UnauthorizedError('Token not yet valid');
      }
      // For any other unexpected errors
      logger.error('Unexpected token verification error', { error });
      throw new UnauthorizedError('Token verification failed');
    }
  }

  public static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const cookieOptions = {
      httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite:
        (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    // Convert JWT time strings to milliseconds
    const accessExpMs = ms(authConfig.jwt.accessTokenExpiration);
    const refreshExpMs = ms(authConfig.jwt.refreshTokenExpiration);

    logger.debug('Setting auth cookies', {
      accessExpMs,
      refreshExpMs,
      cookieOptions,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        COOKIE_SECURE: process.env.COOKIE_SECURE,
        COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
        COOKIE_HTTP_ONLY: process.env.COOKIE_HTTP_ONLY,
      },
    });

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: accessExpMs,
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: refreshExpMs,
    });
  }

  public static clearAuthCookies(res: Response): void {
    const cookieOptions = {
      httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false',
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite:
        (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    logger.debug('Clearing auth cookies', {
      cookieOptions,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
        COOKIE_SECURE: process.env.COOKIE_SECURE,
        COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
        COOKIE_HTTP_ONLY: process.env.COOKIE_HTTP_ONLY,
      },
    });

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  static async register(
    userData: RegisterUserDTO,
    res: Response
  ): Promise<ApiResponse<User>> {
    logger.debug('Registering new user', { email: userData.email });

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      logger.warn('Registration failed - email in use', {
        email: userData.email,
      });
      throw new UnauthorizedError('Email already in use.');
    }

    const hashedPassword = await hash(userData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        activeHouseholdId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImageURL: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        activeHouseholdId: true,
      },
    });

    // Generate tokens
    const payload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + ms(authConfig.jwt.refreshTokenExpiration)
        ),
      },
    });

    // Set auth cookies
    this.setAuthCookies(res, accessToken, refreshToken);

    logger.info('User registered successfully', { userId: user.id });
    return wrapResponse(transformUser(user));
  }

  static async login(
    credentials: LoginCredentials,
    res: Response
  ): Promise<ApiResponse<User>> {
    logger.debug('Login attempt', { email: credentials.email });

    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      select: {
        id: true,
        email: true,
        name: true,
        profileImageURL: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        passwordHash: true,
        activeHouseholdId: true,
      },
    });

    if (!user || !user.passwordHash) {
      logger.warn('Login failed - user not found', {
        email: credentials.email,
      });
      throw new UnauthorizedError('Invalid credentials.');
    }

    const isPasswordValid = await compare(
      credentials.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      logger.warn('Login failed - invalid password', { userId: user.id });
      throw new UnauthorizedError('Invalid credentials.');
    }

    const payload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + ms(authConfig.jwt.refreshTokenExpiration)
        ),
      },
    });

    this.setAuthCookies(res, accessToken, refreshToken);

    logger.info('User logged in successfully', { userId: user.id });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return wrapResponse(transformUser(userWithoutPassword));
  }

  static async logout(res: Response): Promise<ApiResponse<void>> {
    this.clearAuthCookies(res);
    return wrapResponse(undefined);
  }

  static async refreshToken(
    refreshToken: string,
    res: Response
  ): Promise<
    ApiResponse<{
      userId: string;
      email: string;
      accessToken: string;
      refreshToken: string;
    }>
  > {
    logger.debug('Token refresh attempt');

    const decoded = this.verifyToken(
      refreshToken,
      authConfig.jwt.refreshSecret
    );

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!existingToken || existingToken.revoked) {
      logger.warn('Token refresh failed - invalid token', {
        userId: decoded.userId,
      });
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (!existingToken.user) {
      logger.warn('Token refresh failed - user not found', {
        userId: decoded.userId,
      });
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (existingToken.user.deletedAt) {
      logger.warn('Token refresh failed - deleted user', {
        userId: existingToken.user.id,
        deletedAt: existingToken.user.deletedAt,
      });
      throw new UnauthorizedError('Account has been deleted');
    }

    // Create new tokens
    const newPayload: TokenPayload = {
      userId: existingToken.user.id,
      email: existingToken.user.email,
    };

    // Generate new tokens first
    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    try {
      await prisma.$transaction(async (tx: TransactionClient) => {
        // Only revoke old token after new cookies are set
        await tx.refreshToken.update({
          where: { id: existingToken.id },
          data: { revoked: true },
        });

        // Create new refresh token in DB
        await tx.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: existingToken.user.id,
            expiresAt: new Date(
              Date.now() + ms(authConfig.jwt.refreshTokenExpiration)
            ),
          },
        });

        // Set cookies inside transaction to ensure atomicity
        this.setAuthCookies(res, newAccessToken, newRefreshToken);
      });

      logger.info('Token refresh successful', {
        userId: existingToken.user.id,
      });

      return wrapResponse({
        userId: existingToken.user.id,
        email: existingToken.user.email,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      // If database operations fail, clear cookies
      this.clearAuthCookies(res);
      logger.error('Token refresh database operation failed', { error });
      throw error;
    }
  }

  static verifyAccessToken(accessToken: string): TokenPayload {
    return this.verifyToken(accessToken, authConfig.jwt.accessSecret);
  }
}

export async function verifyMembership(
  householdId: string,
  userId: string,
  requiredRoles: HouseholdRole[]
): Promise<HouseholdMember> {
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (
    !membership ||
    !requiredRoles.includes(membership.role as HouseholdRole) ||
    !membership.isAccepted ||
    membership.isRejected ||
    membership.leftAt !== null
  ) {
    throw new UnauthorizedError('Access denied.');
  }

  return transformMembership(membership);
}

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 200,
  };
}
