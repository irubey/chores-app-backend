"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSubtask = transformSubtask;
exports.transformChoreAssignment = transformChoreAssignment;
exports.transformChoreToChoreWithAssignees = transformChoreToChoreWithAssignees;
exports.transformChoresToChoresWithAssignees = transformChoresToChoresWithAssignees;
exports.transformSubtaskInput = transformSubtaskInput;
exports.transformSubtaskUpdateInput = transformSubtaskUpdateInput;
exports.transformChoreSwapRequest = transformChoreSwapRequest;
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const userTransformer_1 = require("./userTransformer");
function isValidChoreStatus(status) {
    return Object.values(enums_1.ChoreStatus).includes(status);
}
function isValidSubtaskStatus(status) {
    return Object.values(enums_1.SubtaskStatus).includes(status);
}
function isValidChoreSwapRequestStatus(status) {
    return Object.values(enums_1.ChoreSwapRequestStatus).includes(status);
}
function transformSubtask(subtask) {
    return {
        id: subtask.id,
        choreId: subtask.choreId,
        title: subtask.title,
        description: subtask.description ?? undefined,
        status: isValidSubtaskStatus(subtask.status)
            ? subtask.status
            : enums_1.SubtaskStatus.PENDING,
    };
}
function transformChoreAssignment(assignment) {
    return {
        id: assignment.id,
        choreId: assignment.choreId,
        userId: assignment.userId,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt ?? undefined,
        user: (0, userTransformer_1.transformUser)(assignment.user),
    };
}
function transformChoreToChoreWithAssignees(chore) {
    const baseChore = {
        id: chore.id,
        householdId: chore.householdId,
        title: chore.title,
        description: chore.description ?? undefined,
        createdAt: chore.createdAt,
        updatedAt: chore.updatedAt,
        deletedAt: chore.deletedAt ?? undefined,
        dueDate: chore.dueDate ?? undefined,
        status: isValidChoreStatus(chore.status)
            ? chore.status
            : enums_1.ChoreStatus.PENDING,
        priority: chore.priority ?? undefined,
        eventId: chore.eventId ?? undefined,
        recurrenceRuleId: chore.recurrenceRuleId ?? undefined,
    };
    const assignments = (chore.assignments ??
        []);
    const subtasks = (chore.subtasks ?? []);
    const swapRequests = (chore.choreSwapRequests ??
        []);
    return {
        ...baseChore,
        assignments: assignments.map(transformChoreAssignment),
        subtasks: subtasks.map(transformSubtask),
        swapRequests: swapRequests.map(transformChoreSwapRequest),
    };
}
function transformChoresToChoresWithAssignees(chores) {
    return chores.map(transformChoreToChoreWithAssignees);
}
function transformSubtaskInput(subtask) {
    return {
        title: subtask.title,
        description: subtask.description ?? null,
        status: subtask.status ?? enums_1.SubtaskStatus.PENDING,
    };
}
function transformSubtaskUpdateInput(subtask, choreId) {
    return {
        title: subtask.title,
        description: subtask.description ?? null,
        status: subtask.status,
        choreId,
    };
}
function transformChoreSwapRequest(swapRequest) {
    return {
        id: swapRequest.id,
        choreId: swapRequest.choreId,
        requestingUserId: swapRequest.requestingUserId,
        targetUserId: swapRequest.targetUserId,
        status: isValidChoreSwapRequestStatus(swapRequest.status)
            ? swapRequest.status
            : enums_1.ChoreSwapRequestStatus.PENDING,
        createdAt: swapRequest.createdAt,
        updatedAt: swapRequest.updatedAt,
    };
}
