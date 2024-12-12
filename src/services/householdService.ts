import prisma from '../config/database';
import {
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
  Household,
  HouseholdWithMembers,
  HouseholdMemberWithUser,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { NotFoundError, BadRequestError } from '../middlewares/errorHandler';
import { HouseholdRole } from '@shared/enums';
import { verifyMembership } from './authService';
import {
  transformHousehold,
  transformHouseholdWithMembers,
  transformHouseholdMember,
} from '../utils/transformers/householdTransformer';
import logger from '../utils/logger';
import {
  PrismaHouseholdBase,
  PrismaHouseholdWithFullRelations,
  PrismaUserMinimal,
  PrismaMemberInput,
} from '../utils/transformers/transformerPrismaTypes';
import { getIO } from '../sockets';
import {
  wrapResponse,
  handleServiceError,
  emitHouseholdEvent,
  emitUserEvent,
} from '../utils/servicesUtils';
import {
  sendEmail,
  generateInvitationEmailTemplate,
  generateInviteToken,
} from '../utils/emailUtils';

const userSelect = {
  id: true,
  email: true,
  name: true,
  profileImageURL: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  activeHouseholdId: true,
} as const;

const householdInclude = {
  members: {
    include: {
      user: {
        select: userSelect,
      },
    },
  },
  threads: true,
  chores: true,
  expenses: true,
  events: true,
  choreTemplates: true,
  notificationSettings: true,
} as const;

// Socket event names
const SOCKET_EVENTS = {
  HOUSEHOLD_UPDATE: 'household_update',
  HOUSEHOLD_DELETED: 'household_deleted',
  MEMBER_REMOVED: 'member_removed',
  INVITATION_ACCEPTED: 'invitation_accepted',
  INVITATION_REJECTED: 'invitation_rejected',
  HOUSEHOLD_INVITATION: 'household_invitation',
} as const;

// Error messages
const ERROR_MESSAGES = {
  HOUSEHOLD_NOT_FOUND: 'Household not found',
  MEMBER_NOT_FOUND: 'Member not found',
  USER_NOT_FOUND: 'User not found',
  INVITER_NOT_FOUND: 'Inviting user not found',
  ALREADY_MEMBER: 'User is already a member of this household',
  INVALID_INVITATION: 'Invalid invitation status',
} as const;

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
  logger.debug('Creating new household', { data, userId });

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
            joinedAt: new Date(),
          },
        },
      },
      include: householdInclude,
    });

    // Set this as the user's active household
    await prisma.user.update({
      where: { id: userId },
      data: { activeHouseholdId: household.id },
    });

    logger.info('Successfully created household', {
      householdId: household.id,
      userId,
    });

    return wrapResponse(
      transformHouseholdWithMembers(
        household as PrismaHouseholdWithFullRelations
      )
    );
  } catch (error) {
    return handleServiceError(error, 'create household') as never;
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
  logger.debug('Getting household members', { householdId, userId });

  try {
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    logger.info('Successfully retrieved household members', {
      householdId,
      memberCount: members.length,
    });

    return wrapResponse(
      members.map((member) =>
        transformHouseholdMember(member as PrismaMemberInput)
      )
    );
  } catch (error) {
    return handleServiceError(error, 'get household members') as never;
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
): Promise<ApiResponse<HouseholdWithMembers>> {
  logger.debug('Getting household by ID', {
    householdId,
    userId,
    includeMembers,
  });

  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: householdInclude,
    });

    if (!household) {
      logger.warn('Household not found', { householdId });
      throw new NotFoundError('Household not found');
    }

    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    logger.info('Successfully retrieved household', { householdId, userId });
    return wrapResponse(
      transformHouseholdWithMembers(
        household as PrismaHouseholdWithFullRelations
      )
    );
  } catch (error) {
    return handleServiceError(error, 'get household by ID') as never;
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
): Promise<ApiResponse<HouseholdWithMembers>> {
  logger.debug('Updating household', { householdId, data, userId });

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
      include: householdInclude,
    });

    const transformedHousehold = transformHouseholdWithMembers(
      household as PrismaHouseholdWithFullRelations
    );

    logger.info('Successfully updated household', {
      householdId,
      userId,
    });

    emitHouseholdEvent(SOCKET_EVENTS.HOUSEHOLD_UPDATE, householdId, {
      household: transformedHousehold,
    });

    return wrapResponse(transformedHousehold);
  } catch (error) {
    return handleServiceError(error, 'update household') as never;
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
  logger.debug('Deleting household', { householdId, userId });

  try {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

    // Clear activeHouseholdId for all users who had this as their active household
    await prisma.user.updateMany({
      where: { activeHouseholdId: householdId },
      data: { activeHouseholdId: null },
    });

    const household = await prisma.household.delete({
      where: { id: householdId },
      include: householdInclude,
    });

    logger.info('Successfully deleted household', { householdId, userId });

    const transformedHousehold = transformHouseholdWithMembers(
      household as PrismaHouseholdWithFullRelations
    );
    emitHouseholdEvent('household_deleted', householdId, {
      household: transformedHousehold,
    });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, 'delete household') as never;
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
  logger.debug('Adding member to household', {
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
      select: userSelect,
    });

    if (!user) {
      logger.warn('User not found when adding member', {
        email: data.email,
        householdId,
      });
      throw new NotFoundError('User not found');
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
      logger.warn('User is already a member', {
        userId: user.id,
        householdId,
      });
      throw new BadRequestError('User is already a member of this household');
    }

    const member = await prisma.householdMember.create({
      data: {
        userId: user.id,
        householdId,
        role: data.role || HouseholdRole.MEMBER,
        isInvited: true,
        isAccepted: false,
        isRejected: false,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    logger.info('Successfully added member to household', {
      householdId,
      newUserId: user.id,
      requestingUserId,
    });

    const transformedMember = transformHouseholdMember(
      member as PrismaMemberInput
    );
    emitUserEvent('household_invitation', user.id, {
      member: transformedMember,
    });

    return wrapResponse(transformedMember);
  } catch (error) {
    return handleServiceError(error, 'add member to household') as never;
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
  logger.debug('Removing member from household', {
    householdId,
    memberId,
    requestingUserId,
  });

  try {
    await verifyMembership(householdId, requestingUserId, [
      HouseholdRole.ADMIN,
    ]);

    const member = await prisma.householdMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: userSelect,
        },
      },
    });

    if (!member) {
      throw new NotFoundError(ERROR_MESSAGES.MEMBER_NOT_FOUND);
    }

    // If this was the user's active household, clear it
    if (member.user?.activeHouseholdId === householdId) {
      await prisma.user.update({
        where: { id: member.user.id },
        data: { activeHouseholdId: null },
      });
    }

    await prisma.householdMember.delete({
      where: { id: memberId },
    });

    logger.info('Successfully removed member from household', {
      householdId,
      memberId,
      requestingUserId,
    });

    getIO()
      .to(`household_${householdId}`)
      .emit(SOCKET_EVENTS.MEMBER_REMOVED, { userId: member.user?.id });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, 'remove member from household') as never;
  }
}

/**
 * Updates the status of a household member (e.g., accept/reject invitation).
 */
export async function acceptOrRejectInvitation(
  householdId: string,
  userId: string,
  accept: boolean
): Promise<ApiResponse<HouseholdMemberWithUser>> {
  logger.debug('Processing invitation response', {
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
          select: userSelect,
        },
      },
    });

    if (!member) {
      logger.warn('Member not found for invitation response', {
        householdId,
        userId,
      });
      throw new NotFoundError('Member not found in the household');
    }

    if (!member.isInvited || member.isAccepted || member.isRejected) {
      logger.warn('Invalid invitation status', {
        householdId,
        userId,
        currentStatus: {
          isInvited: member.isInvited,
          isAccepted: member.isAccepted,
          isRejected: member.isRejected,
        },
      });
      throw new BadRequestError('Invalid invitation status');
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
        leftAt: !accept ? new Date() : null,
        role: accept ? HouseholdRole.MEMBER : member.role,
      },
      include: {
        user: {
          select: userSelect,
        },
        household: {
          include: householdInclude,
        },
      },
    });

    // If accepted, set as active household if user doesn't have one
    if (accept) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeHouseholdId: true },
      });

      if (!user?.activeHouseholdId) {
        await prisma.user.update({
          where: { id: userId },
          data: { activeHouseholdId: householdId },
        });
      }
    }

    logger.info('Successfully processed invitation response', {
      householdId,
      userId,
      accepted: accept,
    });

    const transformedMember = {
      ...transformHouseholdMember(updatedMember as PrismaMemberInput),
      household: updatedMember.household
        ? transformHouseholdWithMembers(
            updatedMember.household as PrismaHouseholdWithFullRelations
        )
        : undefined,
    };

    const eventName = accept ? 'invitation_accepted' : 'invitation_rejected';
    getIO()
      .to(`household_${householdId}`)
      .emit(eventName, { member: transformedMember });

    return wrapResponse(transformedMember);
  } catch (error) {
    return handleServiceError(error, 'process invitation response') as never;
  }
}

/**
 * Retrieves all households for a user.
 */
export async function getHouseholdsByUserId(
  userId: string
): Promise<ApiResponse<HouseholdWithMembers[]>> {
  logger.debug('Getting households for user', { userId });

  try {
    const members = await prisma.householdMember.findMany({
      where: {
        userId,
        isAccepted: true,
        isRejected: false,
      },
      include: {
        household: {
          include: householdInclude,
        },
      },
    });

    logger.info('Successfully retrieved user\'s households', {
      userId,
      count: members.length,
    });

    return wrapResponse(
      members
        .filter((member) => member.household)
        .map((member) =>
          transformHouseholdWithMembers(
            member.household as PrismaHouseholdWithFullRelations
          )
        )
    );
  } catch (error) {
    return handleServiceError(error, 'get user\'s households') as never;
  }
}

/**
 * Retrieves all pending invitations for a user.
 */
export async function getPendingInvitations(
  userId: string
): Promise<ApiResponse<HouseholdMemberWithUser[]>> {
  logger.debug('Getting pending invitations for user', { userId });

  try {
    const members = await prisma.householdMember.findMany({
      where: {
        userId,
        isInvited: true,
        isAccepted: false,
        isRejected: false,
      },
      include: {
        user: {
          select: userSelect,
        },
        household: {
          include: householdInclude,
        },
      },
    });

    logger.info('Successfully retrieved pending invitations', {
      userId,
      count: members.length,
    });

    return wrapResponse(
      members.map((member) => ({
        ...transformHouseholdMember(member as PrismaMemberInput),
        household: member.household
          ? transformHouseholdWithMembers(
              member.household as PrismaHouseholdWithFullRelations
          )
          : undefined,
      }))
    );
  } catch (error) {
    return handleServiceError(error, 'get pending invitations') as never;
  }
}

/**
 * Sends an invitation email to a user.
 */
export async function sendInvitationEmail(
  householdId: string,
  email: string,
  requestingUserId: string
): Promise<ApiResponse<void>> {
  logger.debug('Sending invitation email', {
    householdId,
    email,
    requestingUserId,
  });

  try {
    await verifyMembership(householdId, requestingUserId, [
      HouseholdRole.ADMIN,
    ]);

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          where: { userId: requestingUserId },
          include: {
            user: {
              select: userSelect,
            },
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundError('Household not found');
    }

    const inviter = household.members[0]?.user;
    if (!inviter) {
      throw new NotFoundError('Inviting user not found');
    }

    const token = generateInviteToken();
    const emailTemplate = generateInvitationEmailTemplate(
      household.name,
      inviter.name || inviter.email,
      `${process.env.FRONTEND_URL}/invite?token=${token}`
    );

    await sendEmail({
      to: email,
      subject: `Invitation to join ${household.name}`,
      html: emailTemplate,
    });

    logger.info('Successfully sent invitation email', {
      householdId,
      email,
      requestingUserId,
    });

    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, 'send invitation email') as never;
  }
}

export default {
  createHousehold,
  getHouseholdById,
  updateHousehold,
  deleteHousehold,
  getMembers,
  addMember,
  removeMember,
  acceptOrRejectInvitation,
  getHouseholdsByUserId,
  getPendingInvitations,
  sendInvitationEmail,
};
