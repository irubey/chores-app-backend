"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChores = getChores;
exports.createChore = createChore;
exports.getChoreById = getChoreById;
exports.updateChore = updateChore;
exports.deleteChore = deleteChore;
exports.addSubtask = addSubtask;
exports.updateSubtaskStatus = updateSubtaskStatus;
exports.deleteSubtask = deleteSubtask;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const sockets_1 = require("../sockets");
const prisma = new client_1.PrismaClient();
/**
 * Retrieves all chores for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of chores.
 */
function getChores(householdId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user is a member of the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership) {
            throw new errors_1.UnauthorizedError('You do not have access to this household.');
        }
        const chores = yield prisma.chore.findMany({
            where: { householdId },
            include: {
                subtasks: true,
                assignedUsers: true,
            },
        });
        return chores;
    });
}
/**
 * Creates a new chore within a household.
 * @param householdId - The ID of the household.
 * @param data - The chore data.
 * @param userId - The ID of the user creating the chore.
 * @returns The created chore.
 */
function createChore(householdId, data, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user has ADMIN role in the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== client_1.HouseholdRole.ADMIN) {
            throw new errors_1.UnauthorizedError('You do not have permission to create a chore.');
        }
        const chore = yield prisma.chore.create({
            data: {
                householdId,
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                priority: data.priority,
                recurrence: data.recurrence,
                assignedUsers: {
                    connect: data.assignedUserIds.map((id) => ({ id })),
                },
                subtasks: {
                    create: data.subtasks.map((subtask) => ({ title: subtask.title })),
                },
            },
            include: {
                subtasks: true,
                assignedUsers: true,
            },
        });
        // Emit real-time event for new chore
        sockets_1.io.to(`household_${householdId}`).emit('chore_update', { chore });
        return chore;
    });
}
/**
 * Retrieves details of a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param userId - The ID of the requesting user.
 * @returns The chore details.
 */
function getChoreById(householdId, choreId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user is a member of the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership) {
            throw new errors_1.UnauthorizedError('You do not have access to this household.');
        }
        const chore = yield prisma.chore.findUnique({
            where: { id: choreId },
            include: {
                subtasks: true,
                assignedUsers: true,
            },
        });
        if (!chore) {
            throw new errors_1.NotFoundError('Chore not found.');
        }
        return chore;
    });
}
/**
 * Updates an existing chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore to update.
 * @param data - The updated chore data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated chore.
 */
function updateChore(householdId, choreId, data, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user has ADMIN role in the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== client_1.HouseholdRole.ADMIN) {
            throw new errors_1.UnauthorizedError('You do not have permission to update this chore.');
        }
        const chore = yield prisma.chore.update({
            where: { id: choreId },
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                priority: data.priority,
                status: data.status,
                recurrence: data.recurrence,
                assignedUsers: {
                    set: data.assignedUserIds.map((id) => ({ id })),
                },
                // Handle subtasks if provided
                subtasks: data.subtasks
                    ? {
                        deleteMany: {},
                        create: data.subtasks.map((subtask) => ({ title: subtask.title })),
                    }
                    : undefined,
            },
            include: {
                subtasks: true,
                assignedUsers: true,
            },
        });
        if (!chore) {
            throw new errors_1.NotFoundError('Chore not found or you do not have permission to update it.');
        }
        // Emit real-time event for updated chore
        sockets_1.io.to(`household_${householdId}`).emit('chore_update', { chore });
        return chore;
    });
}
/**
 * Deletes a chore from a household.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore to delete.
 * @param userId - The ID of the user performing the deletion.
 */
function deleteChore(householdId, choreId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user has ADMIN role in the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== client_1.HouseholdRole.ADMIN) {
            throw new errors_1.UnauthorizedError('You do not have permission to delete this chore.');
        }
        const chore = yield prisma.chore.findUnique({
            where: { id: choreId },
        });
        if (!chore) {
            throw new errors_1.NotFoundError('Chore not found.');
        }
        yield prisma.chore.delete({
            where: { id: choreId },
        });
        // Emit real-time event for deleted chore
        sockets_1.io.to(`household_${householdId}`).emit('chore_update', { choreId });
    });
}
/**
 * Adds a subtask to a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskData - The subtask data.
 * @param userId - The ID of the user adding the subtask.
 * @returns The created subtask.
 */
function addSubtask(householdId, choreId, subtaskData, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user has ADMIN role in the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== client_1.HouseholdRole.ADMIN) {
            throw new errors_1.UnauthorizedError('You do not have permission to add a subtask.');
        }
        const chore = yield prisma.chore.findUnique({
            where: { id: choreId },
        });
        if (!chore) {
            throw new errors_1.NotFoundError('Chore not found.');
        }
        const subtask = yield prisma.subtask.create({
            data: {
                choreId,
                title: subtaskData.title,
            },
        });
        // Optionally emit an event for the new subtask
        sockets_1.io.to(`household_${householdId}`).emit('chore_update', { choreId, subtask });
        return subtask;
    });
}
/**
 * Updates the status of a subtask.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask.
 * @param status - The new status of the subtask.
 * @param userId - The ID of the user updating the subtask.
 * @returns The updated subtask.
 */
function updateSubtaskStatus(householdId, choreId, subtaskId, status, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user is a member of the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership) {
            throw new errors_1.UnauthorizedError('You do not have access to this household.');
        }
        const subtask = yield prisma.subtask.update({
            where: { id: subtaskId },
            data: { status },
        });
        if (!subtask) {
            throw new errors_1.NotFoundError('Subtask not found.');
        }
        // Emit real-time event for updated subtask status
        sockets_1.io.to(`household_${householdId}`).emit('chore_update', { choreId, subtask });
        return subtask;
    });
}
/**
 * Deletes a subtask from a chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask to delete.
 * @param userId - The ID of the user performing the deletion.
 */
function deleteSubtask(householdId, choreId, subtaskId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify user has ADMIN role in the household
        const membership = yield prisma.householdMember.findUnique({
            where: {
                householdId_userId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== client_1.HouseholdRole.ADMIN) {
            throw new errors_1.UnauthorizedError('You do not have permission to delete this subtask.');
        }
        const subtask = yield prisma.subtask.findUnique({
            where: { id: subtaskId },
        });
        if (!subtask) {
            throw new errors_1.NotFoundError('Subtask not found.');
        }
        yield prisma.subtask.delete({
            where: { id: subtaskId },
        });
        // Emit real-time event for deleted subtask
        sockets_1.io.to(`household_${householdId}`).emit('chore_update', { choreId, subtaskId });
    });
}
