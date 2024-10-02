import prisma from '../config/database';
import { CreateHouseholdDTO, UpdateHouseholdDTO, AddMemberDTO } from '../types';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../middlewares/errorHandler';

/**
 * Creates a new household and adds the creator as an ADMIN member.
 * @param data - The household data.
 * @param userId - The ID of the user creating the household.
 * @returns The created household with members.
 */
export async function createHousehold(data: CreateHouseholdDTO, userId: string) {
  const household = await prisma.household.create({
    data: {
      name: data.name,
      members: {
        create: {
          userId,
          role: 'ADMIN',
          isInvited: false,
          isAccepted: true,
          isRejected: false,
          isSelected: true,
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
 * Retrieves a household by its ID if the user is a member.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns The household details.
 * @throws NotFoundError if the household does not exist or the user is not a member.
 */
export async function getHouseholdById(householdId: string, userId: string) {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      chores: true,
      expenses: true,
      messages: true,
      events: true,
    },
  });

  if (!household) {
    throw new NotFoundError('Household not found');
  }

  const member = household.members.find((member) => member.userId === userId);

  if (!member) {
    throw new UnauthorizedError('You are not a member of this household');
  }

  return household;
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
export async function updateHousehold(householdId: string, data: UpdateHouseholdDTO, userId: string) {
  // Verify the user is an ADMIN member
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new UnauthorizedError('You do not have permission to update this household');
  }

  const household = await prisma.household.update({
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

  return household;
}

/**
 * Deletes a household.
 * @param householdId - The ID of the household to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws NotFoundError if the household does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 */
export async function deleteHousehold(householdId: string, userId: string): Promise<void> {
  // Verify the user is an ADMIN member
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new UnauthorizedError('You do not have permission to delete this household');
  }

  // Optionally, handle cascading deletions or constraints

  await prisma.household.delete({
    where: { id: householdId },
  });
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
export async function addMember(householdId: string, memberData: AddMemberDTO, userId: string) {
  // Verify the user is an ADMIN member
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new UnauthorizedError('You do not have permission to add members to this household');
  }

  // Check if the user to be added exists
  const user = await prisma.user.findUnique({
    where: { id: memberData.userId },
  });

  if (!user) {
    throw new NotFoundError('User to be added does not exist');
  }

  // Check if the user is already a member
  const existingMember = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberData.userId,
      },
    },
  });

  if (existingMember) {
    throw new BadRequestError('User is already a member of the household');
  }

  // Create an invitation for the new member
  const newMember = await prisma.householdMember.create({
    data: {
      householdId,
      userId: memberData.userId,
      role: memberData.role || 'MEMBER',
      isInvited: true,
      isAccepted: false,
      isRejected: false,
      isSelected: false,
    },
    include: {
      user: true,
    },
  });

  // Optionally, send an invitation notification/email here

  return newMember;
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
export async function removeMember(householdId: string, memberId: string, userId: string): Promise<void> {
  // Verify the user is an ADMIN member
  const requestingMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId,
      },
    },
  });

  if (!requestingMembership || requestingMembership.role !== 'ADMIN') {
    throw new UnauthorizedError('You do not have permission to remove members from this household');
  }

  // Prevent removing oneself if desired, or allow based on business logic
  if (memberId === userId) {
    throw new BadRequestError('Admins cannot remove themselves from the household');
  }

  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });

  if (!member) {
    throw new NotFoundError('Member not found in the household');
  }

  // Ensure there is at least one ADMIN left
  if (member.role === 'ADMIN') {
    const adminCount = await prisma.householdMember.count({
      where: {
        householdId,
        role: 'ADMIN',
      },
    });

    if (adminCount <= 1) {
      throw new BadRequestError('Cannot remove the last ADMIN of the household');
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
  status: 'ACCEPTED' | 'REJECTED'
) {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });

  if (!member) {
    throw new NotFoundError('Member not found in the household');
  }

  if (status === 'ACCEPTED') {
    if (member.isAccepted) {
      throw new BadRequestError('Member is already accepted');
    }

    const updatedMember = await prisma.householdMember.update({
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

    // Optionally, send a notification about acceptance

    return updatedMember;
  } else if (status === 'REJECTED') {
    if (member.isRejected) {
      throw new BadRequestError('Member has already rejected the invitation');
    }

    const updatedMember = await prisma.householdMember.update({
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

    // Optionally, send a notification about rejection

    return updatedMember;
  } else {
    throw new BadRequestError('Invalid status update');
  }
}

/**
 * Retrieves all households where the user has selected them.
 * @param userId - The ID of the user.
 * @returns An array of selected households.
 */
export async function getSelectedHouseholds(userId: string) {
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

  return households;
}

/**
 * Updates the isSelected status of a household member.
 * @param householdId - The ID of the household.
 * @param memberId - The ID of the member.
 * @param isSelected - The new selection status.
 * @returns The updated household member.
 */
export async function updateHouseholdMemberSelection(householdId: string, memberId: string, isSelected: boolean) {
  const member = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: {
        householdId,
        userId: memberId,
      },
    },
  });

  if (!member) {
    throw new NotFoundError('Member not found in the household');
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
  });

  return updatedMember;
}