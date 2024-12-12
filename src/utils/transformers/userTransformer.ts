import { User, UpdateUserDTO } from '@shared/types';
import {
  PrismaUserBase,
  PrismaUserWithFullRelations,
  PrismaUserMinimal,
} from './transformerPrismaTypes';

/**
 * Transforms a Prisma User (base, minimal, or full) into a User type, omitting sensitive fields
 */
export function transformUser(
  prismaUser: PrismaUserBase | PrismaUserMinimal | PrismaUserWithFullRelations
): User {
  const {
    id,
    email,
    name,
    createdAt,
    updatedAt,
    deletedAt,
    profileImageURL,
    activeHouseholdId,
  } = prismaUser;

  const user: User = {
    id,
    email,
    name,
    createdAt,
    updatedAt,
    deletedAt: deletedAt ?? undefined,
    profileImageURL: profileImageURL ?? undefined,
    activeHouseholdId: activeHouseholdId ?? undefined,
  };

  return user;
}

/**
 * Transforms an UpdateUserDTO into a format suitable for Prisma update
 */
export function transformUserUpdateInput(updateData: UpdateUserDTO): {
  name?: string;
  profileImageURL?: string | null;
  activeHouseholdId?: string | null;
} {
  return {
    ...(updateData.name && { name: updateData.name }),
    ...(updateData.profileImageURL !== undefined && {
      profileImageURL: updateData.profileImageURL || null,
    }),
    ...(updateData.activeHouseholdId !== undefined && {
      activeHouseholdId: updateData.activeHouseholdId || null,
    }),
  };
}

/**
 * Transforms a PrismaUser with full relations into a minimal User type
 */
export function transformFullUserToMinimal(
  prismaUser: PrismaUserMinimal
): User {
  return transformUser(prismaUser);
}
