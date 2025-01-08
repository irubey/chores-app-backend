"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformUser = transformUser;
exports.transformUserUpdateInput = transformUserUpdateInput;
exports.transformFullUserToMinimal = transformFullUserToMinimal;
/**
 * Transforms a Prisma User (base, minimal, or full) into a User type, omitting sensitive fields
 */
function transformUser(prismaUser) {
    const { id, email, name, createdAt, updatedAt, deletedAt, profileImageURL, activeHouseholdId, } = prismaUser;
    const user = {
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
function transformUserUpdateInput(updateData) {
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
function transformFullUserToMinimal(prismaUser) {
    return transformUser(prismaUser);
}
