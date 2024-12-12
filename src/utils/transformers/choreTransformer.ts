import {
  Chore,
  Subtask,
  ChoreWithAssignees,
  ChoreSwapRequest,
  ChoreAssignmentWithUser,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
} from '@shared/types';
import {
  ChoreStatus,
  SubtaskStatus,
  ChoreSwapRequestStatus,
} from '@shared/enums';
import {
  PrismaChoreWithFullRelations,
  PrismaSubtaskMinimal,
  PrismaChoreAssignmentWithRelations,
  PrismaChoreSwapRequestWithRelations,
} from './transformerPrismaTypes';
import { transformUser } from './userTransformer';

function isValidChoreStatus(status: string): status is ChoreStatus {
  return Object.values(ChoreStatus).includes(status as ChoreStatus);
}

function isValidSubtaskStatus(status: string): status is SubtaskStatus {
  return Object.values(SubtaskStatus).includes(status as SubtaskStatus);
}

function isValidChoreSwapRequestStatus(
  status: string
): status is ChoreSwapRequestStatus {
  return Object.values(ChoreSwapRequestStatus).includes(
    status as ChoreSwapRequestStatus
  );
}

export function transformSubtask(subtask: PrismaSubtaskMinimal): Subtask {
  return {
    id: subtask.id,
    choreId: subtask.choreId,
    title: subtask.title,
    description: subtask.description ?? undefined,
    status: isValidSubtaskStatus(subtask.status)
      ? subtask.status
      : SubtaskStatus.PENDING,
  };
}

export function transformChoreAssignment(
  assignment: PrismaChoreAssignmentWithRelations
): ChoreAssignmentWithUser {
  return {
    id: assignment.id,
    choreId: assignment.choreId,
    userId: assignment.userId,
    assignedAt: assignment.assignedAt,
    completedAt: assignment.completedAt ?? undefined,
    user: transformUser(assignment.user),
  };
}

export function transformChoreToChoreWithAssignees(
  chore: PrismaChoreWithFullRelations
): ChoreWithAssignees {
  const baseChore: Chore = {
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
      : ChoreStatus.PENDING,
    priority: chore.priority ?? undefined,
    eventId: chore.eventId ?? undefined,
    recurrenceRuleId: chore.recurrenceRuleId ?? undefined,
  };

  const assignments = (chore.assignments ??
    []) as PrismaChoreAssignmentWithRelations[];
  const subtasks = (chore.subtasks ?? []) as PrismaSubtaskMinimal[];
  const swapRequests = (chore.choreSwapRequests ??
    []) as PrismaChoreSwapRequestWithRelations[];

  return {
    ...baseChore,
    assignments: assignments.map(transformChoreAssignment),
    subtasks: subtasks.map(transformSubtask),
    swapRequests: swapRequests.map(transformChoreSwapRequest),
  };
}

export function transformChoresToChoresWithAssignees(
  chores: PrismaChoreWithFullRelations[]
): ChoreWithAssignees[] {
  return chores.map(transformChoreToChoreWithAssignees);
}

export function transformSubtaskInput(subtask: CreateSubtaskDTO): {
  title: string;
  description: string | null;
  status: SubtaskStatus;
} {
  return {
    title: subtask.title,
    description: subtask.description ?? null,
    status: subtask.status ?? SubtaskStatus.PENDING,
  };
}

export function transformSubtaskUpdateInput(
  subtask: UpdateSubtaskDTO,
  choreId: string
): {
  title: string;
  description: string | null;
  status: SubtaskStatus;
  choreId: string;
} {
  return {
    title: subtask.title,
    description: subtask.description ?? null,
    status: subtask.status,
    choreId,
  };
}

export function transformChoreSwapRequest(
  swapRequest: PrismaChoreSwapRequestWithRelations
): ChoreSwapRequest {
  return {
    id: swapRequest.id,
    choreId: swapRequest.choreId,
    requestingUserId: swapRequest.requestingUserId,
    targetUserId: swapRequest.targetUserId,
    status: isValidChoreSwapRequestStatus(swapRequest.status)
      ? swapRequest.status
      : ChoreSwapRequestStatus.PENDING,
    createdAt: swapRequest.createdAt,
    updatedAt: swapRequest.updatedAt,
  };
}
