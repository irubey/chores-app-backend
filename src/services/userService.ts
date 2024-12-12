import prisma from '../config/database';
import { NotFoundError } from '../middlewares/errorHandler';
import { User, UpdateUserDTO } from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import {
  transformUser,
  transformUserUpdateInput,
} from '../utils/transformers/userTransformer';
import { PrismaUserMinimal } from '../utils/transformers/transformerPrismaTypes';
import { getIO } from '../sockets';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Reusable select object that matches the User interface
const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  profileImageURL: true,
  activeHouseholdId: true,
} as const;

/**
 * Retrieves the profile of a user by ID.
 * @param userId - The ID of the user
 * @returns The user profile
 * @throws NotFoundError if the user does not exist
 */
export async function getUserProfile(
  userId: string
): Promise<ApiResponse<User>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const transformedUser = transformUser(user as PrismaUserMinimal);
  return wrapResponse(transformedUser);
}

/**
 * Updates the user's profile information.
 * @param userId - The ID of the user
 * @param data - The data to update
 * @returns The updated user
 * @throws NotFoundError if the user does not exist
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateUserDTO
): Promise<ApiResponse<User>> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: transformUserUpdateInput(data),
    select: userSelect,
  });

  const transformedUser = transformUser(user as PrismaUserMinimal);

  // Notify connected clients about the user update
  getIO().emit('user_updated', { user: transformedUser });

  return wrapResponse(transformedUser);
}
