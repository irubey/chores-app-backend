import prisma from "../config/database";
import { NotFoundError } from "../middlewares/errorHandler";
import { UpdateUserDTO } from "../types";

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
    throw new NotFoundError("User not found.");
  }

  return user;
}

/**
 * Updates the user's profile information.
 * @param userId - The ID of the user
 * @param data - The data to update
 * @returns The updated user
 * @throws NotFoundError if the user does not exist
 */
export async function updateUserProfile(userId: string, data: UpdateUserDTO) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return user;
}
