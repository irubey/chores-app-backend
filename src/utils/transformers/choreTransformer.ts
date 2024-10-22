import {
  Chore,
  Subtask,
  User,
  ChoreWithAssignees,
  ChoreSwapRequest,
} from "@shared/types";
import {
  SubtaskStatus,
  ChoreSwapRequestStatus,
  ChoreStatus,
} from "@shared/enums";
import { PrismaSubtask, PrismaChoreWithRelations } from "./transformerTypes";

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

export function transformSubtask(subtask: PrismaSubtask): Subtask {
  return {
    ...subtask,
    status: isValidSubtaskStatus(subtask.status)
      ? subtask.status
      : SubtaskStatus.PENDING,
    description: subtask.description ?? undefined,
  };
}

export function transformChoreToChoreWithAssignees(
  chore: PrismaChoreWithRelations
): ChoreWithAssignees {
  return {
    ...chore,
    status: isValidChoreStatus(chore.status)
      ? chore.status
      : ChoreStatus.PENDING,
    description: chore.description ?? undefined,
    deletedAt: chore.deletedAt ?? undefined,
    dueDate: chore.dueDate ?? undefined,
    priority: chore.priority ?? undefined,
    eventId: chore.eventId ?? undefined,
    recurrenceRuleId: chore.recurrenceRuleId ?? undefined,
    assignedUsers: chore.assignedUsers.map((assignment) => ({
      ...assignment.user,
      deletedAt: assignment.user.deletedAt ?? undefined,
      profileImageURL: assignment.user.profileImageURL ?? "",
    })) as User[],
    subtasks: chore.subtasks.map(transformSubtask),
  };
}

export function transformChoresToChoresWithAssignees(
  chores: PrismaChoreWithRelations[]
): ChoreWithAssignees[] {
  return chores.map(transformChoreToChoreWithAssignees);
}

export function transformSubtaskInput(subtask: {
  title: string | undefined;
  status: SubtaskStatus;
}): { title: string; status: SubtaskStatus } {
  return {
    title: subtask.title || "",
    status: isValidSubtaskStatus(subtask.status)
      ? subtask.status
      : SubtaskStatus.PENDING,
  };
}

export type PrismaChoreSwapRequest = {
  id: string;
  choreId: string;
  requestingUserId: string;
  targetUserId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
};

export function transformChoreSwapRequest(
  swapRequest: PrismaChoreSwapRequest
): ChoreSwapRequest {
  return {
    ...swapRequest,
    status: isValidChoreSwapRequestStatus(swapRequest.status)
      ? swapRequest.status
      : ChoreSwapRequestStatus.PENDING,
  };
}

export function transformPrismaSubtask(subtask: PrismaSubtask): Subtask {
  return {
    ...subtask,
    description: subtask.description ?? undefined,
    status: isValidSubtaskStatus(subtask.status)
      ? subtask.status
      : SubtaskStatus.PENDING,
  };
}
