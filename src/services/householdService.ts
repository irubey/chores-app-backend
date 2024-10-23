import prisma from "../config/database";
import {
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  Household,
  HouseholdWithMembers,
  HouseholdMemberWithUser,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { NotFoundError, BadRequestError } from "../middlewares/errorHandler";
import { HouseholdRole } from "@shared/enums";
import { verifyMembership } from "./authService";
import {
  transformHouseholdToHouseholdWithMembers,
  transformHouseholdMember,
} from "../utils/transformers/householdTransformer";
import { PrismaHouseholdWithFullRelations } from "../utils/transformers/transformerPrismaTypes";
import { getIO } from "../sockets";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Creates a new household and adds the creator as an ADMIN member.
 * @param data - The household data.
 * @param userId - The ID of the user creating the household.
 * @returns The created household with members.
 */
export async function createHousehold(
  data: CreateHouseholdDTO,
  userId: string
): Promise<ApiResponse<HouseholdWithMembers>> {
  const household = await prisma.household.create({
    data: {
      name: data.name,
      currency: data.currency,
      timezone: data.timezone,
      language: data.language,
      members: {
        create: {
          userId,
          role: HouseholdRole.ADMIN,
          isInvited: false,
          isAccepted: true,
          isRejected: false,
          isSelected: true,
          joinedAt: new Date(),
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      threads: true,
      chores: true,
      expenses: true,
      events: true,
      choreTemplates: true,
      notificationSettings: true,
    },
  });

  return wrapResponse(
    transformHouseholdToHouseholdWithMembers(
      household as PrismaHouseholdWithFullRelations
    )
  );
}

/**
 * Retrieves all members of a household.
 * @param householdId - The ID of the household.
 * @returns An array of household members.
 */
export async function getMembers(
  householdId: string,
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const members = await prisma.householdMember.findMany({
    where: { householdId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMembers = members.map(transformHouseholdMember);
  return wrapResponse(transformedMembers);
}

/**
 * Retrieves a household by its ID if the user is a member.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @param includeMembers - Whether to include household members in the response.
 * @returns The household details.
 * @throws NotFoundError if the household does not exist or the user is not a member.
 */
export async function getHouseholdById(
  householdId: string,
  userId: string,
  includeMembers: boolean = false
): Promise<ApiResponse<Household | HouseholdWithMembers>> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      threads: true,
      chores: true,
      expenses: true,
      events: true,
      choreTemplates: true,
      notificationSettings: true,
    },
  });

  if (!household) {
    throw new NotFoundError("Household not found");
  }

  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  return wrapResponse(
    transformHouseholdToHouseholdWithMembers(
      household as PrismaHouseholdWithFullRelations
    )
  );
}

/**
 * Updates a household's details.
 * @param householdId - The ID of the household to update.
 * @param data - The updated household data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated household.
 * @throws NotFoundError if the household does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 */
export async function updateHousehold(
  householdId: string,
  data: UpdateHouseholdDTO,
  userId: string
): Promise<ApiResponse<Household>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const household = await prisma.household.update({
    where: { id: householdId },
    data: {
      name: data.name,
      currency: data.currency,
      timezone: data.timezone,
      language: data.language,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      threads: true,
      chores: true,
      expenses: true,
      events: true,
      choreTemplates: true,
      notificationSettings: true,
    },
  });

  const transformedHousehold = transformHouseholdToHouseholdWithMembers(
    household as PrismaHouseholdWithFullRelations
  );
  getIO()
    .to(`household_${householdId}`)
    .emit("household_update", { household: transformedHousehold });

  return wrapResponse(transformedHousehold);
}

/**
 * Deletes a household and its related data.
 * @param householdId - The ID of the household to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws NotFoundError if the household does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 */
export async function deleteHousehold(
  householdId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const household = await prisma.household.update({
    where: { id: householdId },
    data: { deletedAt: new Date() },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      threads: true,
      chores: true,
      expenses: true,
      events: true,
      choreTemplates: true,
      notificationSettings: true,
    },
  });

  const transformedHousehold = transformHouseholdToHouseholdWithMembers(
    household as PrismaHouseholdWithFullRelations
  );
  getIO()
    .to(`household_${householdId}`)
    .emit("household_deleted", { household: transformedHousehold });

  return wrapResponse(undefined);
}

/**
 * Adds a new member to the household.
 * @param householdId - The ID of the household.
 * @param data - The data of the member to add.
 * @param requestingUserId - The ID of the user performing the action.
 * @returns The newly added household member.
 * @throws NotFoundError if the household or user does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 * @throws BadRequestError if the user is already a member.
 */
export async function addMember(
  householdId: string,
  data: AddMemberDTO,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
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

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const newMember = await prisma.householdMember.create({
    data: {
      householdId,
      userId: user.id,
      role: data.role || HouseholdRole.MEMBER,
      isInvited: true,
      isAccepted: false,
      isRejected: false,
      isSelected: false,
      joinedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(newMember);
  getIO()
    .to(`user_${user.id}`)
    .emit("household_invitation", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Removes a member from the household.
 * @param householdId - The ID of the household.
 * @param memberId - The ID of the member to remove.
 * @param requestingUserId - The ID of the user performing the action.
 * @throws NotFoundError if the household or member does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN or trying to remove themselves.
 * @throws BadRequestError if attempting to remove the last ADMIN.
 */
export async function removeMember(
  householdId: string,
  memberId: string,
  requestingUserId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const memberToRemove = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!memberToRemove) {
    throw new NotFoundError("Member not found in the household");
  }

  if (
    memberToRemove.role === HouseholdRole.ADMIN &&
    memberToRemove.userId === requestingUserId
  ) {
    const adminCount = await prisma.householdMember.count({
      where: {
        householdId,
        role: HouseholdRole.ADMIN,
      },
    });

    if (adminCount <= 1) {
      throw new BadRequestError(
        "Cannot remove the last ADMIN. Transfer admin role first."
      );
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

  getIO()
    .to(`household_${householdId}`)
    .emit("member_removed", { userId: memberId });

  return wrapResponse(undefined);
}

/**
 * Updates the status of a household member (e.g., accept invitation).
 * @param householdId - The ID of the household.
 * @param memberId - The ID of the member whose status is to be updated.
 * @param status - The new status ('ACCEPTED' or 'REJECTED').
 * @returns The updated household member.
 * @throws NotFoundError if the member does not exist.
 * @throws UnauthorizedError if the user is not authorized to update the status.
 */
export async function updateMemberStatus(
  householdId: string,
  userId: string,
  isSelected: boolean
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!member) {
    throw new NotFoundError("Member not found in the household");
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    data: {
      isSelected,
      isInvited: member.isInvited,
      isAccepted: member.isAccepted,
      isRejected: member.isRejected,
      joinedAt: member.joinedAt,
      leftAt: member.leftAt,
      lastAssignedChoreAt: member.lastAssignedChoreAt,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(updatedMember);
  getIO()
    .to(`household_${householdId}`)
    .emit("member_status_updated", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Retrieves all households where the user has selected them.
 * @param userId - The ID of the user.
 * @returns An array of selected households.
 */
export async function getSelectedHouseholds(
  userId: string
): Promise<ApiResponse<HouseholdWithMembers[]>> {
  const memberships = await prisma.householdMember.findMany({
    where: {
      userId,
      isSelected: true,
      isAccepted: true,
      isRejected: false,
      household: {
        deletedAt: null,
      },
    },
    include: {
      household: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  profileImageURL: true,
                  createdAt: true,
                  updatedAt: true,
                  deletedAt: true,
                },
              },
            },
          },
          threads: true,
          chores: true,
          expenses: true,
          events: true,
          choreTemplates: true,
          notificationSettings: true,
        },
      },
    },
  });

  const households = memberships.map((membership) =>
    transformHouseholdToHouseholdWithMembers(
      membership.household as PrismaHouseholdWithFullRelations
    )
  );

  return wrapResponse(households);
}

/**
 * Updates the isSelected status of a household member.
 * @param householdId - The ID of the household.
 * @param memberId - The ID of the member.
 * @param isSelected - The new selection status.
 * @returns The updated household member.
 */
export async function updateHouseholdMemberSelection(
  householdId: string,
  userId: string,
  isSelected: boolean
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!member) {
    throw new NotFoundError("Member not found in the household");
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    data: {
      isSelected,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(updatedMember);
  getIO()
    .to(`household_${householdId}`)
    .emit("member_selection_updated", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Retrieves all households for a given user.
 * @param userId - The ID of the user.
 * @returns An array of households the user is a member of.
 */
export async function getUserHouseholds(
  userId: string
): Promise<ApiResponse<HouseholdWithMembers[]>> {
  const memberships = await prisma.householdMember.findMany({
    where: {
      userId,
      isAccepted: true,
      isRejected: false,
      household: {
        deletedAt: null,
      },
    },
    include: {
      household: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  profileImageURL: true,
                  createdAt: true,
                  updatedAt: true,
                  deletedAt: true,
                },
              },
            },
          },
          threads: true,
          chores: true,
          expenses: true,
          events: true,
          choreTemplates: true,
          notificationSettings: true,
        },
      },
    },
  });

  const households = memberships.map((membership) =>
    transformHouseholdToHouseholdWithMembers(
      membership.household as PrismaHouseholdWithFullRelations
    )
  );

  return wrapResponse(households);
}

/**
 * Sends an invitation to a user to join a household.
 * @param householdId - The ID of the household.
 * @param data - The data of the user to invite.
 * @param requestingUserId - The ID of the user sending the invitation.
 * @returns The invitation details.
 */
export async function sendInvitation(
  householdId: string,
  data: AddMemberDTO,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const existingMember = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new BadRequestError(
      "User is already a member or has a pending invitation"
    );
  }

  const newMember = await prisma.householdMember.create({
    data: {
      householdId,
      userId: user.id,
      role: data.role || HouseholdRole.MEMBER,
      isInvited: true,
      isAccepted: false,
      isRejected: false,
      isSelected: false,
      joinedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(newMember);
  getIO()
    .to(`user_${user.id}`)
    .emit("household_invitation", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Accepts a household invitation.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the user accepting the invitation.
 * @returns The accepted household member.
 * @throws NotFoundError if the invitation does not exist.
 * @throws UnauthorizedError if the invitation is not for the user.
 */
export async function acceptInvitation(
  householdId: string,
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!member || !member.isInvited) {
    throw new NotFoundError("Invitation not found");
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    data: {
      isInvited: false,
      isAccepted: true,
      isRejected: false,
      isSelected: true,
      joinedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(updatedMember);
  getIO()
    .to(`household_${householdId}`)
    .emit("member_joined", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Rejects a household invitation.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the user rejecting the invitation.
 * @returns The rejected household member.
 * @throws NotFoundError if the invitation does not exist.
 * @throws UnauthorizedError if the invitation is not for the user.
 */
export async function rejectInvitation(
  householdId: string,
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!member || !member.isInvited) {
    throw new NotFoundError("Invitation not found");
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
    data: {
      isRejected: true,
      isAccepted: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(updatedMember);
  getIO()
    .to(`household_${householdId}`)
    .emit("invitation_rejected", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Updates the role of a household member.
 * @param householdId - The ID of the household.
 * @param memberId - The ID of the member whose role is to be updated.
 * @param newRole - The new role for the member.
 * @param requestingUserId - The ID of the user requesting the role update.
 * @returns The updated household member.
 * @throws NotFoundError if the member does not exist.
 * @throws UnauthorizedError if the requesting user is not an ADMIN.
 * @throws BadRequestError if trying to change the role of the last ADMIN.
 */
export async function updateMemberRole(
  householdId: string,
  memberId: string,
  newRole: HouseholdRole,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const memberToUpdate = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!memberToUpdate) {
    throw new NotFoundError("Member not found");
  }

  if (
    memberToUpdate.role === HouseholdRole.ADMIN &&
    newRole === HouseholdRole.MEMBER
  ) {
    const adminCount = await prisma.householdMember.count({
      where: { householdId, role: HouseholdRole.ADMIN },
    });
    if (adminCount <= 1) {
      throw new BadRequestError("Cannot demote the last admin");
    }
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  const transformedMember = transformHouseholdMember(updatedMember);
  getIO()
    .to(`household_${householdId}`)
    .emit("member_role_updated", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Retrieves all invitations for a given user.
 * @param userId - The ID of the user.
 * @returns An array of invitations.
 */
export async function getHouseholdInvitations(
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser[]>> {
  const invitations = await prisma.householdMember.findMany({
    where: {
      userId,
      isInvited: true,
      isAccepted: false,
      isRejected: false,
      household: {
        deletedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          profileImageURL: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
      household: {
        select: {
          id: true,
          name: true,
          currency: true,
          timezone: true,
          language: true,
        },
      },
    },
  });

  return wrapResponse(invitations.map(transformHouseholdMember));
}
