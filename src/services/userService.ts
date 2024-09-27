import prisma from '../config/database';
import { RegisterUserDTO, LoginCredentials, CreateHouseholdDTO, AddMemberDTO, UpdateHouseholdDTO } from '../types';
import { hashPassword, comparePasswords } from '../utils/passwordUtils';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../middlewares/errorHandler';
import { HouseholdRole, Provider, User } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Registers a new user.
 * @param data - User registration data
 * @returns The created user without the password hash
 * @throws BadRequestError if the email is already in use
 */
export async function registerUser(data: RegisterUserDTO) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new BadRequestError('Email is already in use.');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      name: data.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      profileImageURL: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Logs in a user with email and password.
 * @param credentials - User login credentials
 * @returns Authentication tokens
 * @throws UnauthorizedError if credentials are invalid
 */
export async function loginUser(credentials: LoginCredentials) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !(await comparePasswords(credentials.password, user.passwordHash || ''))) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Optionally, you can store the refresh token in the database

  return { accessToken, refreshToken };
}

/**
 * Retrieves the profile of a user by ID.
 * @param userId - The ID of the user
 * @returns The user profile
 * @throws NotFoundError if the user does not exist
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      profileImageURL: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  return user;
}

/**
 * Creates a new household and adds the creator as an admin member.
 * @param data - Household creation data
 * @param userId - The ID of the user creating the household
 * @returns The created household
 */
export async function createHousehold(data: CreateHouseholdDTO, userId: string) {
  const household = await prisma.household.create({
    data: {
      name: data.name,
      members: {
        create: {
          userId: userId,
          role: HouseholdRole.ADMIN,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return household;
}

/**
 * Adds a new member to a household.
 * @param householdId - The ID of the household
 * @param memberId - The ID of the user to add
 * @param role - The role of the new member
 * @param requestingUserId - The ID of the user performing the action
 * @returns The updated household
 * @throws UnauthorizedError if the requesting user is not an admin
 * @throws NotFoundError if the household or member does not exist
 * @throws BadRequestError if the user is already a member
 */
export async function addMemberToHousehold(householdId: string, memberId: string, role: HouseholdRole = HouseholdRole.MEMBER, requestingUserId: string) {
  // Verify requesting user is an admin of the household
  const requesterMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: requestingUserId,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to add members to this household.');
  }

  // Check if the user is already a member
  const existingMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });

  if (existingMembership) {
    throw new BadRequestError('User is already a member of the household.');
  }

  const updatedHousehold = await prisma.household.update({
    where: { id: householdId },
    data: {
      members: {
        create: {
          userId: memberId,
          role: role,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return updatedHousehold;
}

/**
 * Removes a member from a household.
 * @param householdId - The ID of the household
 * @param memberId - The ID of the member to remove
 * @param requestingUserId - The ID of the user performing the action
 * @throws UnauthorizedError if the requesting user is not an admin
 * @throws NotFoundError if the household or member does not exist
 * @throws BadRequestError if attempting to remove the last admin
 */
export async function removeMemberFromHousehold(householdId: string, memberId: string, requestingUserId: string) {
  // Verify requesting user is an admin of the household
  const requesterMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: requestingUserId,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to remove members from this household.');
  }

  // Verify the member exists in the household
  const memberMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });

  if (!memberMembership) {
    throw new NotFoundError('Member not found in the household.');
  }

  // Check if removing this member would leave the household without an admin
  if (memberMembership.role === HouseholdRole.ADMIN) {
    const adminCount = await prisma.householdMember.count({
      where: {
        householdId,
        role: HouseholdRole.ADMIN,
      },
    });

    if (adminCount <= 1) {
      throw new BadRequestError('Cannot remove the last admin from the household.');
    }
  }

  await prisma.householdMember.delete({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });
}

/**
 * Updates household details.
 * @param householdId - The ID of the household
 * @param data - The updated household data
 * @param requestingUserId - The ID of the user performing the action
 * @returns The updated household
 * @throws UnauthorizedError if the requesting user is not an admin
 * @throws NotFoundError if the household does not exist
 */
export async function updateHousehold(householdId: string, data: UpdateHouseholdDTO, requestingUserId: string) {
  // Verify requesting user is an admin of the household
  const requesterMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: requestingUserId,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to update this household.');
  }

  const updatedHousehold = await prisma.household.update({
    where: { id: householdId },
    data: {
      name: data.name,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return updatedHousehold;
}

/**
 * Deletes a household.
 * @param householdId - The ID of the household
 * @param requestingUserId - The ID of the user performing the action
 * @throws UnauthorizedError if the requesting user is not an admin
 * @throws NotFoundError if the household does not exist
 */
export async function deleteHousehold(householdId: string, requestingUserId: string) {
  // Verify requesting user is an admin of the household
  const requesterMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: requestingUserId,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== HouseholdRole.ADMIN) {
    throw new UnauthorizedError('You do not have permission to delete this household.');
  }

  // Optionally, you can add logic to handle related data before deletion

  await prisma.household.delete({
    where: { id: householdId },
  });
}

/**
 * Handles finding or creating a user based on OAuth credentials.
 */
export const findOrCreateOAuthUser = {
  /**
   * Finds an existing user via OAuth or creates a new one.
   * @param params - OAuth user parameters
   * @returns The existing or newly created user
   * @throws BadRequestError if unable to create user
   */
  findOrCreate: async (params: {
    oauthProvider: Provider;
    oauthId: string;
    name: string;
    email: string;
  }): Promise<User> => {
    const { oauthProvider, oauthId, name, email } = params;

    // Check if an OAuthIntegration exists
    let oauthIntegration = await prisma.oAuthIntegration.findUnique({
      where: {
        userId_provider: {
          userId: oauthId,
          provider: oauthProvider,
        },
      },
    });

    if (oauthIntegration) {
      // Return the associated user
      const user = await prisma.user.findUnique({
        where: { id: oauthIntegration.userId },
      });

      if (user) {
        return user;
      } else {
        // If OAuthIntegration exists but user does not, delete the OAuthIntegration
        await prisma.oAuthIntegration.delete({
          where: { id: oauthIntegration.id },
        });
      }
    }

    // If no OAuthIntegration, create a new user and OAuthIntegration
    return await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          profileImageURL: '', // Set default or pass as parameter if available
        },
      });

      await tx.oAuthIntegration.create({
        data: {
          userId: newUser.id,
          provider: oauthProvider,
          accessToken: '', // Store accessToken if needed
          refreshToken: '', // Store refreshToken if needed
          expiresAt: null, // Set expiration if applicable
        },
      });

      return newUser;
    }).catch((error) => {
      logger.error('Error in findOrCreateOAuthUser:', error);
      throw new BadRequestError('Failed to create user via OAuth.');
    });
  },

  /**
   * Retrieves a user by their ID.
   * @param userId - The ID of the user
   * @returns The user object
   * @throws NotFoundError if the user does not exist
   */
  getUserById: async (userId: string): Promise<User> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  },
};

/**
 * Retrieves all households for a user.
 * @param userId - The ID of the user
 * @returns An array of households the user is a member of
 */
export async function getUserHouseholds(userId: string) {
  const households = await prisma.household.findMany({
    where: {
      members: {
        some: {
          userId: userId
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImageURL: true
            }
          }
        }
      }
    }
  });

  return households;
}
