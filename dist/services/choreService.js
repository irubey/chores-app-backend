import { HouseholdRole } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { getIO } from '../sockets';
/**
 * Retrieves all chores for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of chores.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getChores(householdId, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const chores = await prisma.chore.findMany({
        where: { householdId },
        include: {
            subtasks: true,
            assignedUsers: true,
        },
    });
    return chores;
}
/**
 * Creates a new chore within a household.
 * @param householdId - The ID of the household.
 * @param data - The chore data.
 * @param userId - The ID of the user creating the chore.
 * @returns The created chore.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 */
export async function createChore(householdId, data, userId) {
    // Verify user has ADMIN role in the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to create a chore.');
    }
    const chore = await prisma.chore.create({
        data: {
            householdId,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            priority: data.priority,
            recurrence: data.recurrence,
            assignedUsers: {
                connect: data.assignedUserIds?.map((id) => ({ id })) || [],
            },
            subtasks: {
                create: data.subtasks?.map((subtask) => ({ title: subtask.title })) || [],
            },
        },
        include: {
            subtasks: true,
            assignedUsers: true,
        },
    });
    // Emit real-time event for new chore
    getIO().to(`household_${householdId}`).emit('chore_update', { chore });
    return chore;
}
/**
 * Retrieves details of a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param userId - The ID of the requesting user.
 * @returns The chore details.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the chore does not exist.
 */
export async function getChoreById(householdId, choreId, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const chore = await prisma.chore.findUnique({
        where: { id: choreId },
        include: {
            subtasks: true,
            assignedUsers: true,
        },
    });
    if (!chore) {
        throw new NotFoundError('Chore not found.');
    }
    return chore;
}
/**
 * Updates an existing chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore to update.
 * @param data - The updated chore data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated chore.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the chore does not exist.
 */
export async function updateChore(householdId, choreId, data, userId) {
    // Verify user has ADMIN role in the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to update this chore.');
    }
    // Ensure that all subtasks have a defined title
    const formattedSubtasks = data.subtasks?.map((subtask) => {
        if (!subtask.title) {
            throw new Error('Subtask title is required.');
        }
        return { title: subtask.title };
    });
    const chore = await prisma.chore.update({
        where: { id: choreId },
        data: {
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            priority: data.priority,
            status: data.status,
            recurrence: data.recurrence,
            assignedUsers: {
                set: data.assignedUserIds?.map((id) => ({ id })) || [],
            },
            subtasks: data.subtasks
                ? {
                    deleteMany: {},
                    create: formattedSubtasks,
                }
                : undefined,
        },
        include: {
            subtasks: true,
            assignedUsers: true,
        },
    });
    if (!chore) {
        throw new NotFoundError('Chore not found or you do not have permission to update it.');
    }
    // Emit real-time event for updated chore
    getIO().to(`household_${householdId}`).emit('chore_update', { chore });
    return chore;
}
/**
 * Deletes a chore from a household.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the chore does not exist.
 */
export async function deleteChore(householdId, choreId, userId) {
    // Verify user has ADMIN role in the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to delete this chore.');
    }
    const chore = await prisma.chore.findUnique({
        where: { id: choreId },
    });
    if (!chore) {
        throw new NotFoundError('Chore not found.');
    }
    await prisma.chore.delete({
        where: { id: choreId },
    });
    // Emit real-time event for deleted chore
    getIO().to(`household_${householdId}`).emit('chore_update', { choreId });
}
/**
 * Adds a subtask to a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskData - The subtask data.
 * @param userId - The ID of the user adding the subtask.
 * @returns The created subtask.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the chore does not exist.
 */
export async function addSubtask(householdId, choreId, subtaskData, userId) {
    // Verify user has ADMIN role in the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to add a subtask.');
    }
    const chore = await prisma.chore.findUnique({
        where: { id: choreId },
    });
    if (!chore) {
        throw new NotFoundError('Chore not found.');
    }
    const subtask = await prisma.subtask.create({
        data: {
            choreId,
            title: subtaskData.title,
        },
    });
    // Emit real-time event for the new subtask
    getIO().to(`household_${householdId}`).emit('chore_update', { choreId, subtask });
    return subtask;
}
/**
 * Updates the status of a subtask.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask.
 * @param status - The new status of the subtask.
 * @param userId - The ID of the user updating the subtask.
 * @returns The updated subtask.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function updateSubtaskStatus(householdId, choreId, subtaskId, status, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const subtask = await prisma.subtask.update({
        where: { id: subtaskId },
        data: { status },
    });
    if (!subtask) {
        throw new NotFoundError('Subtask not found.');
    }
    // Emit real-time event for updated subtask status
    getIO().to(`household_${householdId}`).emit('chore_update', { choreId, subtask });
    return subtask;
}
/**
 * Deletes a subtask from a chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function deleteSubtask(householdId, choreId, subtaskId, userId) {
    // Verify user has ADMIN role in the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to delete this subtask.');
    }
    const subtask = await prisma.subtask.findUnique({
        where: { id: subtaskId },
    });
    if (!subtask) {
        throw new NotFoundError('Subtask not found.');
    }
    await prisma.subtask.delete({
        where: { id: subtaskId },
    });
    // Emit real-time event for deleted subtask
    getIO().to(`household_${householdId}`).emit('chore_update', { choreId, subtaskId });
}
