"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChores = getChores;
exports.createChore = createChore;
exports.getChoreById = getChoreById;
exports.updateChore = updateChore;
exports.deleteChore = deleteChore;
exports.createChoreSwapRequest = createChoreSwapRequest;
exports.approveOrRejectChoreSwap = approveOrRejectChoreSwap;
const errorHandler_1 = require("../middlewares/errorHandler");
const database_1 = __importDefault(require("../config/database"));
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const sockets_1 = require("../sockets");
const choreTransformer_1 = require("../utils/transformers/choreTransformer");
const authService_1 = require("./authService");
const subtaskService_1 = require("./subtaskService");
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
// Helper function to create history record
async function createChoreHistory(tx, choreId, action, userId) {
    await tx.choreHistory.create({
        data: {
            choreId,
            action,
            changedById: userId,
        },
    });
}
/**
 * Retrieves all chores for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns An array of ChoreWithAssignees and subtasks.
 * @throws UnauthorizedError if the user is not a household member.
 */
async function getChores(householdId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const chores = (await database_1.default.chore.findMany({
        where: { householdId },
        include: {
            subtasks: true,
            assignments: {
                include: {
                    user: true,
                },
            },
        },
    }));
    const transformedChores = (0, choreTransformer_1.transformChoresToChoresWithAssignees)(chores);
    return wrapResponse(transformedChores);
}
/**
 * Creates a new chore within a household.
 */
async function createChore(householdId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    const chore = await database_1.default.$transaction(async (tx) => {
        const createdChore = (await tx.chore.create({
            data: {
                householdId,
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                status: data.status ?? enums_1.ChoreStatus.PENDING,
                priority: data.priority,
                recurrenceRuleId: data.recurrenceRuleId,
            },
            include: {
                household: true,
                event: true,
                recurrenceRule: true,
                assignments: {
                    include: {
                        user: true,
                    },
                },
                history: {
                    include: {
                        user: true,
                    },
                },
            },
        }));
        if (data.subtasks) {
            // Use subtaskService instead of direct creation
            for (const subtaskData of data.subtasks) {
                await (0, subtaskService_1.addSubtask)(householdId, createdChore.id, subtaskData, userId);
            }
        }
        await createChoreHistory(tx, createdChore.id, enums_1.ChoreAction.CREATED, userId);
        return createdChore;
    });
    const transformedChore = (0, choreTransformer_1.transformChoreToChoreWithAssignees)(chore);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('chore_created', { chore: transformedChore });
    return wrapResponse(transformedChore);
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
async function getChoreById(householdId, choreId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const chore = (await database_1.default.chore.findUnique({
        where: { id: choreId },
        include: {
            subtasks: true,
            assignments: {
                include: { user: true },
            },
            choreSwapRequests: {
                where: { status: enums_1.ChoreSwapRequestStatus.PENDING },
                include: {
                    requestingUser: true,
                    targetUser: true,
                },
            },
        },
    }));
    if (!chore) {
        throw new errorHandler_1.NotFoundError('Chore not found.');
    }
    const transformedChore = (0, choreTransformer_1.transformChoreToChoreWithAssignees)(chore);
    return wrapResponse(transformedChore);
}
/**
 * Updates an existing chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore to update.
 * @param data - The updated chore data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated chore.
 * @throws UnauthorizedError if the user does not have WRITE access.
 * @throws NotFoundError if the chore does not exist.
 */
async function updateChore(householdId, choreId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const chore = (await database_1.default.$transaction(async (tx) => {
        const updatedChore = await tx.chore.update({
            where: { id: choreId },
            data: {
                title: data.title,
                description: data.description,
                dueDate: data.dueDate,
                priority: data.priority,
                status: data.status,
                recurrenceRuleId: data.recurrenceRuleId,
                assignments: {
                    deleteMany: {},
                    create: data.assignments?.map((assignment) => ({
                        userId: assignment.userId,
                        assignedAt: new Date(),
                    })) || [],
                },
                subtasks: data.subtasks
                    ? {
                        deleteMany: {},
                        create: data.subtasks.map((subtask) => (0, choreTransformer_1.transformSubtaskUpdateInput)(subtask, choreId)),
                    }
                    : undefined,
            },
            include: {
                subtasks: true,
                assignments: {
                    include: { user: true },
                },
            },
        });
        await createChoreHistory(tx, choreId, enums_1.ChoreAction.UPDATED, userId);
        return updatedChore;
    }));
    const transformedChore = (0, choreTransformer_1.transformChoreToChoreWithAssignees)(chore);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('chore_update', { chore: transformedChore });
    return wrapResponse(transformedChore);
}
/**
 * Soft deletes a chore from a household.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the chore does not exist.
 */
async function deleteChore(householdId, choreId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    const chore = (await database_1.default.chore.findUnique({
        where: { id: choreId },
        include: {
            event: true,
            assignments: true,
            subtasks: true,
        },
    }));
    if (!chore) {
        throw new errorHandler_1.NotFoundError('Chore not found');
    }
    await database_1.default.$transaction(async (tx) => {
        // Cancel any pending swap requests
        await tx.choreSwapRequest.updateMany({
            where: {
                choreId,
                status: enums_1.ChoreSwapRequestStatus.PENDING,
            },
            data: {
                status: enums_1.ChoreSwapRequestStatus.REJECTED,
            },
        });
        // Delete associated event if exists
        if (chore.event) {
            await tx.event.delete({ where: { id: chore.event.id } });
        }
        // Delete assignments
        await tx.choreAssignment.deleteMany({ where: { choreId } });
        // Delete subtasks
        await tx.subtask.deleteMany({ where: { choreId } });
        // Delete the chore
        await tx.chore.delete({ where: { id: choreId } });
        // Create history record
        await createChoreHistory(tx, choreId, enums_1.ChoreAction.DELETED, userId);
    });
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('chore_update', { choreId, deleted: true });
}
/**
 * Creates a new chore swap request.
 */
async function createChoreSwapRequest(householdId, data, requestingUserId) {
    await (0, authService_1.verifyMembership)(householdId, requestingUserId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const swapRequest = (await database_1.default.$transaction(async (tx) => {
        const chore = await tx.chore.findUnique({
            where: { id: data.choreId },
            include: {
                assignments: true,
            },
        });
        if (!chore || chore.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Chore not found in this household');
        }
        const existingAssignment = chore.assignments.find((a) => a.userId === requestingUserId);
        if (!existingAssignment) {
            throw new errorHandler_1.UnauthorizedError('You are not assigned to this chore');
        }
        const createdSwapRequest = await tx.choreSwapRequest.create({
            data: {
                choreId: data.choreId,
                requestingUserId: requestingUserId,
                targetUserId: data.targetUserId,
                status: enums_1.ChoreSwapRequestStatus.PENDING,
            },
            include: {
                chore: true,
                requestingUser: true,
                targetUser: true,
            },
        });
        await createChoreHistory(tx, data.choreId, enums_1.ChoreAction.UPDATED, requestingUserId);
        return createdSwapRequest;
    }));
    const transformedSwapRequest = (0, choreTransformer_1.transformChoreSwapRequest)(swapRequest);
    (0, sockets_1.getIO)()
        .to(`household_${householdId}`)
        .emit('chore_swap_request', { swapRequest: transformedSwapRequest });
    return wrapResponse(transformedSwapRequest);
}
/**
 * Approves or rejects a chore swap request.
 */
async function approveOrRejectChoreSwap(householdId, choreId, swapRequestId, approved, approvingUserId) {
    await (0, authService_1.verifyMembership)(householdId, approvingUserId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const result = (await database_1.default.$transaction(async (tx) => {
        const swapRequest = await tx.choreSwapRequest.findUnique({
            where: { id: swapRequestId },
            include: {
                chore: true,
                requestingUser: true,
                targetUser: true,
            },
        });
        if (!swapRequest || swapRequest.choreId !== choreId) {
            throw new errorHandler_1.NotFoundError('Swap request not found or does not match the chore.');
        }
        if (swapRequest.targetUserId !== approvingUserId) {
            throw new errorHandler_1.UnauthorizedError('You are not authorized to approve this swap request.');
        }
        if (approved) {
            await tx.choreAssignment.deleteMany({
                where: {
                    choreId,
                    userId: swapRequest.requestingUserId,
                },
            });
            await tx.choreAssignment.create({
                data: {
                    choreId,
                    userId: swapRequest.targetUserId,
                    assignedAt: new Date(),
                },
            });
            await tx.choreSwapRequest.update({
                where: { id: swapRequestId },
                data: { status: enums_1.ChoreSwapRequestStatus.APPROVED },
            });
            await createChoreHistory(tx, choreId, enums_1.ChoreAction.SWAPPED, approvingUserId);
        }
        else {
            await tx.choreSwapRequest.update({
                where: { id: swapRequestId },
                data: { status: enums_1.ChoreSwapRequestStatus.REJECTED },
            });
        }
        return await tx.chore.findUnique({
            where: { id: choreId },
            include: {
                household: true,
                event: true,
                recurrenceRule: true,
                subtasks: true,
                assignments: {
                    include: {
                        user: true,
                    },
                },
                history: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }));
    const transformedChore = (0, choreTransformer_1.transformChoreToChoreWithAssignees)(result);
    if (approved) {
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('chore_swap_approved', {
            choreId,
            chore: transformedChore,
            swapRequestId,
        });
    }
    else {
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('chore_swap_rejected', {
            choreId,
            swapRequestId,
        });
    }
    return wrapResponse(transformedChore);
}
