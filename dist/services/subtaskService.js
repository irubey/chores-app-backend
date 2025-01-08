"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSubtask = addSubtask;
exports.updateSubtask = updateSubtask;
exports.deleteSubtask = deleteSubtask;
exports.getSubtasks = getSubtasks;
const errorHandler_1 = require("../middlewares/errorHandler");
const database_1 = __importDefault(require("../config/database"));
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const sockets_1 = require("../sockets");
const authService_1 = require("./authService");
const choreTransformer_1 = require("../utils/transformers/choreTransformer");
function wrapResponse(data) {
    return { data };
}
async function createChoreHistory(tx, choreId, action, userId) {
    await tx.choreHistory.create({
        data: {
            choreId,
            action,
            changedById: userId,
        },
    });
}
async function addSubtask(householdId, choreId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const subtask = await database_1.default.$transaction(async (tx) => {
        const chore = await tx.chore.findUnique({
            where: { id: choreId },
            include: { household: true },
        });
        if (!chore || chore.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Chore not found in this household');
        }
        const createdSubtask = await tx.subtask.create({
            data: {
                ...(0, choreTransformer_1.transformSubtaskInput)(data),
                choreId,
            },
            include: {
                chore: true,
            },
        });
        await createChoreHistory(tx, choreId, enums_1.ChoreAction.UPDATED, userId);
        return createdSubtask;
    });
    const transformedSubtask = (0, choreTransformer_1.transformSubtask)(subtask);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('subtask_created', {
        choreId,
        subtask: transformedSubtask,
    });
    return wrapResponse(transformedSubtask);
}
async function updateSubtask(householdId, choreId, subtaskId, data, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const subtask = await database_1.default.$transaction(async (tx) => {
        const chore = await tx.chore.findUnique({
            where: { id: choreId },
            include: { household: true },
        });
        if (!chore || chore.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Chore not found in this household');
        }
        const updatedSubtask = await tx.subtask.update({
            where: { id: subtaskId },
            data: (0, choreTransformer_1.transformSubtaskUpdateInput)(data, choreId),
            include: {
                chore: true,
            },
        });
        if (data.status === enums_1.SubtaskStatus.COMPLETED) {
            const allSubtasks = await tx.subtask.findMany({
                where: { choreId },
            });
            const allCompleted = allSubtasks.every((st) => st.status === enums_1.SubtaskStatus.COMPLETED);
            if (allCompleted) {
                await tx.chore.update({
                    where: { id: choreId },
                    data: { status: enums_1.ChoreStatus.COMPLETED },
                });
                await createChoreHistory(tx, choreId, enums_1.ChoreAction.COMPLETED, userId);
            }
        }
        await createChoreHistory(tx, choreId, enums_1.ChoreAction.UPDATED, userId);
        return updatedSubtask;
    });
    const transformedSubtask = (0, choreTransformer_1.transformSubtask)(subtask);
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('subtask_updated', {
        choreId,
        subtask: transformedSubtask,
    });
    return wrapResponse(transformedSubtask);
}
async function deleteSubtask(householdId, choreId, subtaskId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
    await database_1.default.$transaction(async (tx) => {
        const chore = await tx.chore.findUnique({
            where: { id: choreId },
            include: { household: true },
        });
        if (!chore || chore.householdId !== householdId) {
            throw new errorHandler_1.NotFoundError('Chore not found in this household');
        }
        await tx.subtask.delete({
            where: { id: subtaskId },
        });
        await createChoreHistory(tx, choreId, enums_1.ChoreAction.UPDATED, userId);
    });
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit('subtask_deleted', {
        choreId,
        subtaskId,
    });
    return wrapResponse(undefined);
}
async function getSubtasks(householdId, choreId, userId) {
    await (0, authService_1.verifyMembership)(householdId, userId, [
        enums_1.HouseholdRole.ADMIN,
        enums_1.HouseholdRole.MEMBER,
    ]);
    const chore = await database_1.default.chore.findUnique({
        where: {
            id: choreId,
            householdId,
        },
        include: { subtasks: true },
    });
    if (!chore) {
        throw new errorHandler_1.NotFoundError('Chore not found in this household');
    }
    const transformedSubtasks = chore.subtasks.map((subtask) => (0, choreTransformer_1.transformSubtask)(subtask));
    return wrapResponse(transformedSubtasks);
}
