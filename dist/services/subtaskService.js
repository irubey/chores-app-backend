import { HouseholdRole } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { getIO } from '../sockets';
/**
 * Adds a new subtask to a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param data - The subtask data.
 * @param userId - The ID of the user adding the subtask.
 * @returns The created subtask.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the chore does not exist.
 */
export async function addSubtask(householdId, choreId, data, userId) {
    if (!userId) {
        throw new UnauthorizedError('Unauthorized');
    }
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
    // Verify the chore exists
    const chore = await prisma.chore.findUnique({
        where: { id: choreId },
    });
    if (!chore) {
        throw new NotFoundError('Chore not found.');
    }
    const subtask = await prisma.subtask.create({
        data: {
            choreId,
            title: data.title,
            status: data.status || 'PENDING',
        },
    });
    // Emit real-time event for the new subtask
    getIO().to(`household_${householdId}`).emit('subtask_update', { subtask });
    return subtask;
}
/**
 * Updates the status of an existing subtask.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask.
 * @param status - The new status of the subtask.
 * @param userId - The ID of the user updating the subtask.
 * @returns The updated subtask.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function updateSubtaskStatus(householdId, choreId, subtaskId, status, userId) {
    if (!userId) {
        throw new UnauthorizedError('Unauthorized');
    }
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
        throw new UnauthorizedError('You do not have permission to update this subtask.');
    }
    const subtask = await prisma.subtask.update({
        where: { id: subtaskId },
        data: { status },
    });
    if (!subtask) {
        throw new NotFoundError('Subtask not found.');
    }
    // Emit real-time event for updated subtask status
    getIO().to(`household_${householdId}`).emit('subtask_update', { subtask });
    return subtask;
}
/**
 * Deletes a subtask from a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function deleteSubtask(householdId, choreId, subtaskId, userId) {
    if (!userId) {
        throw new UnauthorizedError('Unauthorized');
    }
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
    getIO().to(`household_${householdId}`).emit('subtask_update', { subtaskId });
}
