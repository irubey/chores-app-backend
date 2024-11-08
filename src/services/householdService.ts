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
} from "../utils/transformers/householdTransformer";
import logger from "../utils/logger";
import {
  PrismaHouseholdBase,
  PrismaHouseholdWithFullRelations,
  PrismaUserMinimal,
} from "../utils/transformers/transformerPrismaTypes";
import { getIO } from "../sockets";
import {
  wrapResponse,
  handleServiceError,
  emitHouseholdEvent,
  emitUserEvent,
} from "../utils/servicesUtils";

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
  logger.debug("Creating new household", { data, userId });

  try {
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

    logger.info("Successfully created household", {
      householdId: household.id,
      userId,
    });

    return wrapResponse(
      transformHouseholdToHouseholdWithMembers(
        household as PrismaHouseholdWithFullRelations
      )
    );
  } catch (error) {
    return handleServiceError(error, "create household") as never;
  }
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
  logger.debug("Getting household members", { householdId, userId });

  try {
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

    logger.info("Successfully retrieved household members", {
      householdId,
      memberCount: members.length,
    });

    return wrapResponse(members.map(transformHouseholdMember));
  } catch (error) {
    return handleServiceError(error, "get household members") as never;
  }
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
  logger.debug("Getting household by ID", {
    householdId,
    userId,
    includeMembers,
  });

  try {
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
      logger.warn("Household not found", { householdId });
      throw new NotFoundError("Household not found");
    }

    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    logger.info("Successfully retrieved household", { householdId, userId });
    return wrapResponse(
      transformHouseholdToHouseholdWithMembers(
        household as PrismaHouseholdWithFullRelations
      )
    );
  } catch (error) {
    return handleServiceError(error, "get household by ID") as never;
  }
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
  logger.debug("Updating household", { householdId, data, userId });

  try {
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

    logger.info("Successfully updated household", {
      householdId,
      userId,
    });

    emitHouseholdEvent("household_update", householdId, {
      household: transformedHousehold,
    });

    return wrapResponse(transformedHousehold);
  } catch (error) {
    return handleServiceError(error, "update household") as never;
  }
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
  logger.debug("Deleting household", { householdId, userId });

  try {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

    const household = await prisma.household.delete({
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

    logger.info("Successfully deleted household", { householdId, userId });

    const transformedHousehold = transformHouseholdToHouseholdWithMembers(
      household as PrismaHouseholdWithFullRelations
    );
    emitHouseholdEvent("household_deleted", householdId, {
      household: transformedHousehold,
    });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, "delete household") as never;
  }
}

/**
 * Adds a new member to a household.
 */
export async function addMember(
  householdId: string,
  data: AddMemberDTO,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  logger.debug("Adding member to household", {
    householdId,
    email: data.email,
    requestingUserId,
  });

  try {
    await verifyMembership(householdId, requestingUserId, [
      HouseholdRole.ADMIN,
    ]);

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
      logger.warn("User not found when adding member", {
        email: data.email,
        householdId,
      });
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
      logger.warn("User is already a member", {
        userId: user.id,
        householdId,
      });
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

    logger.info("Successfully added member to household", {
      householdId,
      newUserId: user.id,
      requestingUserId,
    });

    const transformedMember = transformHouseholdMember(member);
    emitUserEvent("household_invitation", user.id, {
      member: transformedMember,
    });

    return wrapResponse(transformedMember);
  } catch (error) {
    return handleServiceError(error, "add member to household") as never;
  }
}

/**
 * Removes a member from a household.
 */
export async function removeMember(
  householdId: string,
  memberId: string,
  requestingUserId: string
): Promise<ApiResponse<void>> {
  logger.debug("Removing member from household", {
    householdId,
    memberId,
    requestingUserId,
  });

  try {
    await verifyMembership(householdId, requestingUserId, [
      HouseholdRole.ADMIN,
    ]);

    await prisma.householdMember.delete({
      where: {
        userId_householdId: {
          householdId,
          userId: memberId,
        },
      },
    });

    logger.info("Successfully removed member from household", {
      householdId,
      memberId,
      requestingUserId,
    });

    getIO()
      .to(`household_${householdId}`)
      .emit("member_removed", { userId: memberId });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, "remove member from household") as never;
  }
}

/**
 * Updates the status of a household member (e.g., accept/reject invitation).
 * @param householdId - The ID of the household.
 * @param userId - The ID of the user whose status is being updated.
 * @param status - Whether to accept (true) or reject (false) the invitation.
 * @returns The updated household member.
 * @throws NotFoundError if the member does not exist.
 * @throws BadRequestError if the invitation status is invalid.
 */
export async function acceptOrRejectInvitation(
  householdId: string,
  userId: string,
  accept: boolean
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  logger.debug("Processing invitation response", {
    householdId,
    userId,
    accept,
  });

  try {
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
      logger.warn("Member not found for invitation response", {
        householdId,
        userId,
      });
      throw new NotFoundError("Member not found in the household");
    }

    if (!member.isInvited || member.isAccepted || member.isRejected) {
      logger.warn("Invalid invitation status", {
        householdId,
        userId,
        currentStatus: {
          isInvited: member.isInvited,
          isAccepted: member.isAccepted,
          isRejected: member.isRejected,
        },
      });
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
        isAccepted: accept,
        isRejected: !accept,
        joinedAt: accept ? new Date() : member.joinedAt,
        leftAt: accept ? null : new Date(),
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

    logger.info("Successfully processed invitation response", {
      householdId,
      userId,
      accepted: accept,
    });

    const transformedMember = transformHouseholdMember(updatedMember);
    const eventName = accept ? "invitation_accepted" : "invitation_rejected";
    getIO()
      .to(`household_${householdId}`)
      .emit(eventName, { member: transformedMember });

    return wrapResponse(transformedMember);
  } catch (error) {
    return handleServiceError(error, "process invitation response") as never;
  }
}

/**
 * Gets all households selected by the authenticated user.
 */
export async function getSelectedHouseholds(
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser[]>> {
  try {
    logger.debug("Finding selected households", { userId });

    const members = await prisma.householdMember.findMany({
      where: {
        userId,
        isSelected: true,
        isAccepted: true,
        isRejected: false,
        leftAt: null,
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
          },
        },
      },
    });

    logger.info("Found selected households", {
      userId,
      count: members.length,
    });

    return wrapResponse(members.map(transformHouseholdMember));
  } catch (error) {
    return handleServiceError(error, "find selected households") as never;
  }
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
  logger.debug("Updating household member selection", {
    householdId,
    userId,
    isSelected,
  });

  try {
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
      logger.warn("Member not found when updating selection", {
        householdId,
        userId,
      });
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

    logger.info("Successfully updated member selection", {
      householdId,
      userId,
      isSelected,
    });

    const transformedMember = transformHouseholdMember(updatedMember);
    getIO()
      .to(`household_${householdId}`)
      .emit("member_selection_updated", { member: transformedMember });

    return wrapResponse(transformedMember);
  } catch (error) {
    return handleServiceError(error, "update member selection") as never;
  }
}

/**
 * Gets all households for a user.
 */
export async function getUserHouseholds(
  userId: string
): Promise<ApiResponse<HouseholdWithMembers[]>> {
  logger.debug("Getting user households", { userId });

  try {
    const households = await prisma.household.findMany({
      where: {
        members: {
          some: {
            userId,
            leftAt: null,
            isAccepted: true,
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

    logger.info("Successfully retrieved user households", {
      userId,
      count: households.length,
    });

    return {
      data: households.map((h) =>
        transformHouseholdToHouseholdWithMembers(
          h as PrismaHouseholdWithFullRelations
        )
      ),
    };
  } catch (error) {
    return handleServiceError(error, "get user households") as never;
  }
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
  logger.debug("Sending household invitation", {
    householdId,
    email: data.email,
    requestingUserId,
  });

  try {
    await verifyMembership(householdId, requestingUserId, [
      HouseholdRole.ADMIN,
    ]);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      logger.warn("User not found when sending invitation", {
        email: data.email,
        householdId,
      });
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
      logger.warn("User already has pending invitation", {
        userId: user.id,
        householdId,
      });
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

    logger.info("Successfully sent household invitation", {
      householdId,
      newUserId: user.id,
      requestingUserId,
    });

    const transformedMember = transformHouseholdMember(newMember);
    getIO()
      .to(`user_${user.id}`)
      .emit("household_invitation", { member: transformedMember });

    return wrapResponse(transformedMember);
  } catch (error) {
    return handleServiceError(error, "send household invitation") as never;
  }
}

/**
 * Updates the role of a household member.
 */
export async function updateHouseholdMemberRole(
  householdId: string,
  memberId: string,
  role: HouseholdRole,
  requestingUserId: string
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  logger.debug("Updating household member role", {
    householdId,
    memberId,
    role,
    requestingUserId,
  });

  try {
    await verifyMembership(householdId, requestingUserId, [
      HouseholdRole.ADMIN,
    ]);

    const member = await prisma.householdMember.update({
      where: { id: memberId },
      data: { role },
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

    logger.info("Successfully updated member role", {
      householdId,
      memberId,
      role,
      requestingUserId,
    });

    return wrapResponse(transformHouseholdMember(member));
  } catch (error) {
    return handleServiceError(error, "update member role") as never;
  }
}

/**
 * Gets all pending invitations for the authenticated user.
 */
export async function getInvitations(
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser[]>> {
  logger.debug("Getting user invitations", { userId });

  try {
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
        household: true,
      },
    });

    logger.info("Successfully retrieved user invitations", {
      userId,
      count: invitations.length,
    });

    return wrapResponse(invitations.map(transformHouseholdMember));
  } catch (error) {
    return handleServiceError(error, "get user invitations") as never;
  }
}
