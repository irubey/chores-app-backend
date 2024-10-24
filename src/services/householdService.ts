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
  transformHousehold,
  transformHouseholdToHouseholdWithMembers,
  transformHouseholdMember,
  transformCreateHouseholdDTO,
  transformUpdateHouseholdDTO,
} from "../utils/transformers/householdTransformer";
import {
  PrismaHouseholdBase,
  PrismaHouseholdWithFullRelations,
  PrismaUserMinimal,
} from "../utils/transformers/transformerPrismaTypes";
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
 * Adds a new member to a household.
 */
export async function addMember(
  householdId: string,
  data: AddMemberDTO,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const user = (await prisma.user.findUnique({
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
  })) as PrismaUserMinimal;

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
    throw new BadRequestError("User is already a member of this household");
  }

  const member = await prisma.householdMember.create({
    data: {
      userId: user.id,
      householdId,
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

  const transformedMember = transformHouseholdMember(member);
  getIO()
    .to(`user_${user.id}`)
    .emit("household_invitation", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Removes a member from a household.
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
  });

  if (!memberToRemove) {
    throw new NotFoundError("Member not found");
  }

  if (memberToRemove.role === HouseholdRole.ADMIN) {
    const adminCount = await prisma.householdMember.count({
      where: { householdId, role: HouseholdRole.ADMIN },
    });
    if (adminCount <= 1) {
      throw new BadRequestError("Cannot remove the last admin");
    }
  }

  await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
    data: {
      leftAt: new Date(),
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
 * Gets all households for a user.
 */
export async function getUserHouseholds(
  userId: string
): Promise<ApiResponse<HouseholdWithMembers[]>> {
  const households = (await prisma.household.findMany({
    where: {
      members: {
        some: {
          userId,
          leftAt: null,
          isAccepted: true,
        },
      },
      deletedAt: null,
    },
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
  })) as PrismaHouseholdWithFullRelations[];

  return wrapResponse(households.map(transformHouseholdToHouseholdWithMembers));
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

  if (!member) {
    throw new NotFoundError("Invitation not found");
  }

  if (!member.isInvited || member.isAccepted || member.isRejected) {
    throw new BadRequestError("Invalid invitation status");
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
    .emit("invitation_accepted", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Updates a member's role in a household.
 */
export async function updateMemberRole(
  householdId: string,
  targetUserId: string,
  newRole: HouseholdRole,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: targetUserId,
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
    throw new NotFoundError("Member not found");
  }

  if (member.role === HouseholdRole.ADMIN && newRole !== HouseholdRole.ADMIN) {
    const adminCount = await prisma.householdMember.count({
      where: {
        householdId,
        role: HouseholdRole.ADMIN,
        leftAt: null,
      },
    });

    if (adminCount <= 1) {
      throw new BadRequestError("Cannot demote the last admin");
    }
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId: targetUserId,
      },
    },
    data: {
      role: newRole,
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
    .emit("member_role_updated", { member: transformedMember });

  return wrapResponse(transformedMember);
}

/**
 * Rejects a household invitation.
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

  if (!member) {
    throw new NotFoundError("Invitation not found");
  }

  if (!member.isInvited || member.isAccepted || member.isRejected) {
    throw new BadRequestError("Invalid invitation status");
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
      isAccepted: false,
      isRejected: true,
      leftAt: new Date(),
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

/**
 * Updates the selected status of a household for a user.
 */
export async function updateSelectedHousehold(
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
    throw new NotFoundError("Member not found");
  }

  if (!member.isAccepted || member.leftAt) {
    throw new BadRequestError("Invalid member status");
  }

  // If setting as selected, unselect all other households
  if (isSelected) {
    await prisma.householdMember.updateMany({
      where: {
        userId,
        isSelected: true,
        householdId: {
          not: householdId,
        },
      },
      data: {
        isSelected: false,
      },
    });
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

  return wrapResponse(transformHouseholdMember(updatedMember));
}

/**
 * Gets the currently selected household for a user.
 */
export async function getSelectedHousehold(
  userId: string
): Promise<ApiResponse<HouseholdWithMembers>> {
  const household = (await prisma.household.findFirst({
    where: {
      members: {
        some: {
          userId,
          isSelected: true,
          isAccepted: true,
          leftAt: null,
        },
      },
      deletedAt: null,
    },
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
  })) as PrismaHouseholdWithFullRelations;

  if (!household) {
    throw new NotFoundError("No household selected");
  }

  return wrapResponse(transformHouseholdToHouseholdWithMembers(household));
}
