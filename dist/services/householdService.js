import prisma from '../config/database';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../middlewares/errorHandler';
/**
 * Creates a new household and adds the creator as an ADMIN member.
 * @param data - The household data.
 * @param userId - The ID of the user creating the household.
 * @returns The created household with members.
 */
export async function createHousehold(data, userId) {
    const household = await prisma.household.create({
        data: {
            name: data.name,
            members: {
                create: {
                    userId,
                    role: 'ADMIN',
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
export async function getHouseholdById(householdId, userId) {
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
    const isMember = household.members.some((member) => member.userId === userId);
    if (!isMember) {
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
export async function updateHousehold(householdId, data, userId) {
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
export async function deleteHousehold(householdId, userId) {
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
    // Optionally, you might want to delete related data or handle constraints
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
 * @throws NotFoundError if the household does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 * @throws BadRequestError if the user is already a member.
 */
export async function addMember(householdId, memberData, userId) {
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
    const newMember = await prisma.householdMember.create({
        data: {
            householdId,
            userId: memberData.userId,
            role: memberData.role || 'MEMBER',
        },
        include: {
            user: true,
        },
    });
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
export async function removeMember(householdId, memberId, userId) {
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
