import prisma from "../config/database";
import { RegisterUserDTO, TokenPayload } from "../types";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../middlewares/errorHandler";
import authConfig from "../config/auth";
import { Response } from "express";
import { HouseholdRole as PrismaHouseholdRole } from "@prisma/client"; // Import from Prisma
import { HouseholdMember } from "@shared/types";
import { HouseholdRole } from "@shared/enums";

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

  /**
   * Sets HTTP-only cookies for access and refresh tokens.
   * @param res Express Response object
   * @param accessToken - The access token
   * @param refreshToken - The refresh token
   */
  private static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }

  /**
   * Clears authentication cookies.
   * @param res Express Response object
   */
  private static clearAuthCookies(res: Response): void {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
  }

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
      throw new UnauthorizedError("Email already in use.");
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
   * @param res - Express Response object to set cookies.
   * @returns The user data.
   * @throws UnauthorizedError if credentials are invalid.
   */
  static async login(email: string, password: string, res: Response) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const payload: TokenPayload = { userId: user.id, email: user.email };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    this.setAuthCookies(res, accessToken, refreshToken);

    // Remove sensitive information before sending
    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Logs out a user by clearing the refresh token cookie.
   * @param res Express Response object to clear cookies.
   * @returns void
   */
  static async logout(res: Response): Promise<void> {
    this.clearAuthCookies(res);
    // Optionally, implement token blacklisting here
    return;
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * @param refreshToken - The refresh token.
   * @param res - Express Response object to set new cookies.
   * @returns New access token.
   * @throws UnauthorizedError if refresh token is invalid or expired.
   */
  static async refreshToken(refreshToken: string, res: Response) {
    const decoded = this.verifyToken(
      refreshToken,
      authConfig.jwt.refreshSecret
    );

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token.");
    }

    const newPayload: TokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    this.setAuthCookies(res, newAccessToken, newRefreshToken);

    return newAccessToken;
  }

  /**
   * Verifies the access token.
   * @param accessToken - The access token.
   * @returns The decoded payload.
   * @throws UnauthorizedError if token is invalid or expired.
   */
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

  // Convert Prisma HouseholdMember to shared HouseholdMember type
  const sharedMembership: HouseholdMember = {
    id: membership.id,
    userId: membership.userId,
    householdId: membership.householdId,
    role: membership.role as HouseholdRole, // Type assertion here
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
