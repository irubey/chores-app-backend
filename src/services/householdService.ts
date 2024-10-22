import prisma from "../config/database";
import {
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  Household,
  HouseholdMember,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { NotFoundError, BadRequestError } from "../middlewares/errorHandler";
import { HouseholdRole } from "@shared/enums";
import { verifyMembership } from "./authService";
import {
  transformHouseholdToHouseholdWithMembers,
  transformHouseholdMember,
  PrismaHousehold,
  PrismaHouseholdMember,
} from "../utils/transformers/householdTransformer";
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
): Promise<ApiResponse<Household>> {
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
    },
  });

  const transformedHousehold = transformHouseholdToHouseholdWithMembers(
    household as PrismaHousehold
  );
  return wrapResponse(transformedHousehold);
}

/**
 * Retrieves all members of a household.
 * @param householdId - The ID of the household.
 * @returns An array of household members.
 */
export async function getMembers(
  householdId: string,
  userId: string
): Promise<ApiResponse<HouseholdMember[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const members = await prisma.householdMember.findMany({
    where: { householdId },
    include: { user: true },
  });

  const transformedMembers = members.map((member) =>
    transformHouseholdMember(member as PrismaHouseholdMember)
  );
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
): Promise<ApiResponse<Household>> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      ...(includeMembers && {
        members: {
          include: {
            user: true,
          },
        },
      }),
      chores: true,
      expenses: true,
      threads: true,
      events: true,
    },
  });

  if (!household) {
    throw new NotFoundError("Household not found");
  }

  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const transformedHousehold = transformHouseholdToHouseholdWithMembers(
    household as PrismaHousehold
  );
  return wrapResponse(transformedHousehold);
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
    },
  });

  const transformedHousehold = transformHouseholdToHouseholdWithMembers(
    household as PrismaHousehold
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

  await prisma.$transaction(async (tx) => {
    // Delete related data
    await tx.message.deleteMany({ where: { thread: { householdId } } });
    await tx.thread.deleteMany({ where: { householdId } });
    await tx.chore.deleteMany({ where: { householdId } });
    await tx.expense.deleteMany({ where: { householdId } });
    await tx.event.deleteMany({ where: { householdId } });
    await tx.choreTemplate.deleteMany({ where: { householdId } });
    await tx.notificationSettings.deleteMany({ where: { householdId } });

    // Delete household members
    await tx.householdMember.deleteMany({ where: { householdId } });

    // Delete the household
    await tx.household.delete({ where: { id: householdId } });
  });

  getIO()
    .to(`household_${householdId}`)
    .emit("household_deleted", { householdId });

  return wrapResponse(undefined);
}

/**
 * Adds a new member to the household.
 * @param householdId - The ID of the household.
 * @param memberData - The data of the member to add.
 * @param userId - The ID of the user performing the action.
 * @returns The newly added household member.
 * @throws NotFoundError if the household or user does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 * @throws BadRequestError if the user is already a member.
 */
export async function addMember(
  householdId: string,
  memberData: AddMemberDTO,
  userId: string
): Promise<ApiResponse<HouseholdMember>> {
  return prisma.$transaction(async (tx) => {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

    const targetUser = await tx.user.findUnique({
      where: { email: memberData.email },
    });

    if (!targetUser) {
      throw new NotFoundError("User with the provided email does not exist");
    }

    const existingMember = await tx.householdMember.findUnique({
      where: {
        userId_householdId: {
          householdId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestError("User is already a member of the household");
    }

    const newMember = await tx.householdMember.create({
      data: {
        householdId,
        userId: targetUser.id,
        role: memberData.role || HouseholdRole.MEMBER,
        isInvited: true,
        isAccepted: false,
        isRejected: false,
        isSelected: false,
        joinedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    const transformedMember = transformHouseholdMember(
      newMember as PrismaHouseholdMember
    );
    getIO()
      .to(`household_${householdId}`)
      .emit("member_added", { member: transformedMember });

    return wrapResponse(transformedMember);
  });
}

/**
 * Removes a member from the household.
 * @param householdId - The ID of the household.
 * @param memberId - The ID of the member to remove.
 * @param userId - The ID of the user performing the action.
 * @throws NotFoundError if the household or member does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN or trying to remove themselves.
 * @throws BadRequestError if attempting to remove the last ADMIN.
 */
export async function removeMember(
  householdId: string,
  memberId: string,
  userId: string
): Promise<ApiResponse<void>> {
  return prisma.$transaction(async (tx) => {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

    const member = await tx.householdMember.findUnique({
      where: {
        userId_householdId: {
          householdId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found in the household");
    }

    if (memberId === userId) {
      throw new BadRequestError(
        "Admins cannot remove themselves from the household"
      );
    }

    if (member.role === HouseholdRole.ADMIN) {
      const adminCount = await tx.householdMember.count({
        where: {
          householdId,
          role: HouseholdRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestError(
          "Cannot remove the last ADMIN of the household"
        );
      }
    }

    await tx.householdMember.delete({
      where: {
        userId_householdId: {
          householdId,
          userId: memberId,
        },
      },
    });

    getIO()
      .to(`household_${householdId}`)
      .emit("member_removed", { householdId, memberId });

    return wrapResponse(undefined);
  });
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
  memberId: string,
  status: "ACCEPTED" | "REJECTED"
): Promise<ApiResponse<HouseholdMember>> {
  return prisma.$transaction(async (tx) => {
    const member = await tx.householdMember.findUnique({
      where: {
        userId_householdId: {
          householdId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found in the household");
    }

    let updatedMember: PrismaHouseholdMember;

    if (status === "ACCEPTED") {
      if (member.isAccepted) {
        throw new BadRequestError("Member is already accepted");
      }

      updatedMember = await tx.householdMember.update({
        where: {
          userId_householdId: {
            householdId,
            userId: memberId,
          },
        },
        data: {
          isAccepted: true,
          isInvited: false,
          isRejected: false,
          isSelected: true,
        },
        include: {
          user: true,
        },
      });
    } else if (status === "REJECTED") {
      if (member.isRejected) {
        throw new BadRequestError("Member has already rejected the invitation");
      }

      updatedMember = await tx.householdMember.update({
        where: {
          userId_householdId: {
            householdId,
            userId: memberId,
          },
        },
        data: {
          isRejected: true,
          isInvited: false,
          isAccepted: false,
          isSelected: false,
        },
        include: {
          user: true,
        },
      });
    } else {
      throw new BadRequestError("Invalid status update");
    }

    const transformedMember = transformHouseholdMember(updatedMember);
    getIO()
      .to(`household_${householdId}`)
      .emit("member_status_updated", { member: transformedMember });

    return wrapResponse(transformedMember);
  });
}

/**
 * Retrieves all households where the user has selected them.
 * @param userId - The ID of the user.
 * @returns An array of selected households.
 */
export async function getSelectedHouseholds(
  userId: string
): Promise<ApiResponse<Household[]>> {
  const households = await prisma.household.findMany({
    where: {
      members: {
        some: {
          userId,
          isSelected: true,
        },
      },
    },
    include: {
      members: {
        where: { userId },
        include: { user: true },
      },
    },
  });

  const transformedHouseholds = households.map((household) =>
    transformHouseholdToHouseholdWithMembers(household as PrismaHousehold)
  );
  return wrapResponse(transformedHouseholds);
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
  memberId: string,
  isSelected: boolean
): Promise<ApiResponse<HouseholdMember>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
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
        userId: memberId,
      },
    },
    data: {
      isSelected,
    },
    include: {
      user: true,
    },
  });

  const transformedMember = transformHouseholdMember(
    updatedMember as PrismaHouseholdMember
  );
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
): Promise<ApiResponse<Household[]>> {
  const households = await prisma.household.findMany({
    where: {
      members: {
        some: {
          userId: userId,
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

  const transformedHouseholds = households.map((household) =>
    transformHouseholdToHouseholdWithMembers(household as PrismaHousehold)
  );
  return wrapResponse(transformedHouseholds);
}

/**
 * Sends an invitation to a user to join a household.
 * @param householdId - The ID of the household.
 * @param email - The email of the user to invite.
 * @param userId - The ID of the user sending the invitation.
 * @returns The invitation details.
 */
export async function sendInvitation(
  householdId: string,
  email: string,
  userId: string
): Promise<ApiResponse<HouseholdMember>> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFoundError("User with the provided email does not exist");
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
    throw new BadRequestError("User is already a member of the household");
  }

  const newMember = await prisma.householdMember.create({
    data: {
      householdId,
      userId: user.id,
      role: HouseholdRole.MEMBER,
      isInvited: true,
      isAccepted: false,
      isRejected: false,
      isSelected: false,
      joinedAt: new Date(),
    },
  });

  // Optionally, send an invitation email here

  const transformedMember = transformHouseholdMember(
    newMember as PrismaHouseholdMember
  );
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
): Promise<ApiResponse<HouseholdMember>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
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
    },
  });

  const transformedMember = transformHouseholdMember(
    updatedMember as PrismaHouseholdMember
  );
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
): Promise<ApiResponse<HouseholdMember>> {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
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
      isAccepted: false,
      isRejected: true,
      isSelected: false,
    },
  });

  const transformedMember = transformHouseholdMember(
    updatedMember as PrismaHouseholdMember
  );
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
): Promise<ApiResponse<HouseholdMember>> {
  await verifyMembership(householdId, requestingUserId, [HouseholdRole.ADMIN]);

  const memberToUpdate = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });

  if (!memberToUpdate) {
    throw new NotFoundError("Member not found in the household");
  }

  if (
    memberToUpdate.role === HouseholdRole.ADMIN &&
    newRole === HouseholdRole.MEMBER
  ) {
    const adminCount = await prisma.householdMember.count({
      where: {
        householdId,
        role: HouseholdRole.ADMIN,
      },
    });

    if (adminCount <= 1) {
      throw new BadRequestError("Cannot change the role of the last ADMIN");
    }
  }

  const updatedMember = await prisma.householdMember.update({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
    data: {
      role: newRole,
    },
    include: {
      user: true,
    },
  });

  const transformedMember = transformHouseholdMember(
    updatedMember as PrismaHouseholdMember
  );
  getIO()
    .to(`household_${householdId}`)
    .emit("member_role_updated", { member: transformedMember });

  return wrapResponse(transformedMember);
}
