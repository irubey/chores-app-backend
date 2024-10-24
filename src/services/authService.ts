import prisma from "../config/database";
import { TokenPayload } from "@shared/interfaces/auth";
import { RegisterUserDTO, LoginCredentials } from "@shared/types/user";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../middlewares/errorHandler";
import authConfig from "../config/auth";
import { Response } from "express";
import { HouseholdRole } from "@shared/enums";
import { HouseholdMember } from "@shared/types/household";
import { transformUser } from "../utils/transformers/userTransformer";
import { User } from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
/**
 * AuthService handles the business logic for authentication.
 */
export class AuthService {
  private static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, authConfig.jwt.accessSecret, {
      expiresIn: authConfig.jwt.accessTokenExpiration,
    });
  }

  private static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, authConfig.jwt.refreshSecret, {
      expiresIn: authConfig.jwt.refreshTokenExpiration,
    });
  }

  private static verifyToken(token: string, secret: string): TokenPayload {
    try {
      return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired token.");
    }
  }

  private static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private static clearAuthCookies(res: Response): void {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
  }

  static async register(userData: RegisterUserDTO): Promise<ApiResponse<User>> {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new UnauthorizedError("Email already in use.");
    }

    const hashedPassword = await hash(userData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileImageURL: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return wrapResponse(transformUser(user));
  }

  static async login(
    credentials: LoginCredentials,
    res: Response
  ): Promise<ApiResponse<User>> {
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
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const isPasswordValid = await compare(
      credentials.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const payload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    this.setAuthCookies(res, accessToken, refreshToken);

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
  ): Promise<ApiResponse<string>> {
    const decoded = this.verifyToken(
      refreshToken,
      authConfig.jwt.refreshSecret
    );

    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!existingToken || existingToken.revoked) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    const newPayload: TokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    this.setAuthCookies(res, newAccessToken, newRefreshToken);

    return wrapResponse(newAccessToken);
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
    !requiredRoles.includes(membership.role as HouseholdRole)
  ) {
    throw new UnauthorizedError("Access denied.");
  }

  const sharedMembership: HouseholdMember = {
    id: membership.id,
    userId: membership.userId,
    householdId: membership.householdId,
    role: membership.role as HouseholdRole,
    joinedAt: membership.joinedAt,
    leftAt: membership.leftAt ?? undefined,
    isInvited: membership.isInvited,
    isAccepted: membership.isAccepted,
    isRejected: membership.isRejected,
    isSelected: membership.isSelected,
    lastAssignedChoreAt: membership.lastAssignedChoreAt ?? undefined,
  };

  return sharedMembership;
}

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}
