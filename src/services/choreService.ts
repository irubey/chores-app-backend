import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import prisma from "../config/database";
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  CreateSubtaskDTO,
  ChoreSwapRequest,
  Subtask,
  ChoreWithAssignees,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import {
  HouseholdRole,
  ChoreStatus,
  ChoreSwapRequestStatus,
  SubtaskStatus,
  ChoreAction,
} from "@shared/enums";
import { getIO } from "../sockets";
import {
  transformChoreToChoreWithAssignees,
  transformChoresToChoresWithAssignees,
  transformSubtaskInput,
  transformSubtask,
  transformChoreSwapRequest,
  PrismaChoreSwapRequest,
} from "../utils/transformers/choreTransformer";
import {
  PrismaChoreWithRelations,
  PrismaSubtask,
} from "../utils/transformers/transformerTypes";
import { verifyMembership } from "./authService";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Retrieves all chores for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns An array of ChoreWithAssignees and subtasks.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getChores(
  householdId: string,
  userId: string
): Promise<ApiResponse<ChoreWithAssignees[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const chores = (await prisma.chore.findMany({
    where: { householdId },
    include: {
      subtasks: true,
      assignedUsers: {
        include: { user: true },
      },
    },
  })) as PrismaChoreWithRelations[];

  const transformedChores = transformChoresToChoresWithAssignees(chores);
  return wrapResponse(transformedChores);
}

/**
 * Creates a new chore within a household.
 * @param householdId - The ID of the household.
 * @param data - The chore data.
 * @param userId - The ID of the user creating the chore.
 * @returns The created chore.
 * @throws UnauthorizedError if the user does not have WRITE access.
 */
export async function createChore(
  householdId: string,
  data: CreateChoreDTO,
  userId: string
): Promise<ApiResponse<ChoreWithAssignees>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const chore = (await prisma.chore.create({
    data: {
      householdId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      status: data.status || ChoreStatus.PENDING,
      recurrenceRuleId: data.recurrenceRuleId,
      assignedUsers: {
        connect: data.assignedUserIds?.map((id) => ({ id })) || [],
      },
      subtasks: {
        create:
          data.subtasks?.map((subtask: CreateSubtaskDTO) => ({
            title: subtask.title,
            status: subtask.status || SubtaskStatus.PENDING,
          })) || [],
      },
    },
    include: {
      subtasks: true,
      assignedUsers: {
        include: { user: true },
      },
    },
  })) as PrismaChoreWithRelations;

  const transformedChore = transformChoreToChoreWithAssignees(chore);
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { chore: transformedChore });

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
export async function getChoreById(
  householdId: string,
  choreId: string,
  userId: string
): Promise<ApiResponse<ChoreWithAssignees>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const chore = (await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      subtasks: true,
      assignedUsers: {
        include: { user: true },
      },
    },
  })) as PrismaChoreWithRelations;

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  const transformedChore = transformChoreToChoreWithAssignees(chore);
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
export async function updateChore(
  householdId: string,
  choreId: string,
  data: UpdateChoreDTO,
  userId: string
): Promise<ApiResponse<ChoreWithAssignees>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const chore = (await prisma.chore.update({
    where: { id: choreId },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      status: data.status,
      recurrenceRuleId: data.recurrenceRuleId,
      assignedUsers: {
        set: data.assignedUserIds?.map((id) => ({ id })) || [],
      },
      subtasks: data.subtasks
        ? {
            deleteMany: {},
            create: data.subtasks.map(transformSubtaskInput),
          }
        : undefined,
    },
    include: {
      subtasks: true,
      assignedUsers: {
        include: { user: true },
      },
    },
  })) as PrismaChoreWithRelations;

  const transformedChore = transformChoreToChoreWithAssignees(chore);
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { chore: transformedChore });

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
export async function deleteChore(
  householdId: string,
  choreId: string,
  userId: string
): Promise<void> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const chore = await prisma.chore.findUnique({ where: { id: choreId } });

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  await prisma.chore.delete({ where: { id: choreId } });

  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { choreId, deleted: true });

  await prisma.choreHistory.create({
    data: {
      choreId,
      action: ChoreAction.DELETED,
      changedById: userId,
    },
  });
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
export async function addSubtask(
  householdId: string,
  choreId: string,
  data: CreateSubtaskDTO,
  userId: string
): Promise<ApiResponse<Subtask>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const chore = await prisma.chore.findUnique({ where: { id: choreId } });

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  const subtask = (await prisma.subtask.create({
    data: {
      choreId,
      title: data.title,
      description: data.description || null,
      status: data.status || SubtaskStatus.PENDING,
    },
  })) as PrismaSubtask;

  const transformedSubtask = transformSubtask(subtask);
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { choreId, subtask: transformedSubtask });

  return wrapResponse(transformedSubtask);
}

/**
 * Updates the status of a subtask.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask.
 * @param status - The new status of the subtask.
 * @param userId - The ID of the user updating the subtask.
 * @returns The updated subtask.
 * @throws UnauthorizedError if the user does not have WRITE access.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function updateSubtaskStatus(
  householdId: string,
  choreId: string,
  subtaskId: string,
  status: SubtaskStatus,
  userId: string
): Promise<ApiResponse<Subtask>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const subtask = (await prisma.subtask.update({
    where: { id: subtaskId },
    data: { status },
  })) as PrismaSubtask;

  if (!subtask) {
    throw new NotFoundError("Subtask not found.");
  }

  const transformedSubtask = transformSubtask(subtask);
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { choreId, subtask: transformedSubtask });

  return wrapResponse(transformedSubtask);
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
export async function deleteSubtask(
  householdId: string,
  choreId: string,
  subtaskId: string,
  userId: string
): Promise<void> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });

  if (!subtask) {
    throw new NotFoundError("Subtask not found.");
  }

  await prisma.subtask.delete({ where: { id: subtaskId } });

  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { choreId, subtaskId });
}

export async function requestChoreSwap(
  householdId: string,
  choreId: string,
  requestingUserId: string,
  targetUserId: string
): Promise<ApiResponse<ChoreSwapRequest>> {
  await verifyMembership(householdId, requestingUserId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);
  await verifyMembership(householdId, targetUserId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const chore = await prisma.chore.findUnique({ where: { id: choreId } });

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  const swapRequest = await prisma.choreSwapRequest.create({
    data: {
      choreId,
      requestingUserId,
      targetUserId,
      status: ChoreSwapRequestStatus.PENDING,
    },
  });

  const transformedSwapRequest = transformChoreSwapRequest(
    swapRequest as PrismaChoreSwapRequest
  );
  getIO()
    .to(`household_${householdId}`)
    .emit("chore_swap_request", { swapRequest: transformedSwapRequest });

  return wrapResponse(transformedSwapRequest);
}

export async function approveChoreSwap(
  householdId: string,
  choreId: string,
  swapRequestId: string,
  approved: boolean,
  approvingUserId: string
): Promise<ApiResponse<ChoreWithAssignees>> {
  await verifyMembership(householdId, approvingUserId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  return prisma.$transaction(async (prismaTransaction) => {
    const swapRequest = await prismaTransaction.choreSwapRequest.findUnique({
      where: { id: swapRequestId },
      include: { chore: true },
    });

    if (!swapRequest || swapRequest.choreId !== choreId) {
      throw new NotFoundError(
        "Swap request not found or does not match the chore."
      );
    }

    if (swapRequest.targetUserId !== approvingUserId) {
      throw new UnauthorizedError(
        "You are not authorized to approve this swap request."
      );
    }

    let updatedChore;
    let updatedSwapRequest;

    if (approved) {
      updatedChore = await prismaTransaction.chore.update({
        where: { id: choreId },
        data: {
          assignedUsers: {
            disconnect: {
              choreId_userId: { choreId, userId: swapRequest.requestingUserId },
            },
            connect: {
              choreId_userId: { choreId, userId: swapRequest.targetUserId },
            },
          },
        },
        include: {
          assignedUsers: { include: { user: true } },
          subtasks: true,
        },
      });

      updatedSwapRequest = await prismaTransaction.choreSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: ChoreSwapRequestStatus.APPROVED },
      });
    } else {
      updatedSwapRequest = await prismaTransaction.choreSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: ChoreSwapRequestStatus.REJECTED },
      });

      updatedChore = await prismaTransaction.chore.findUnique({
        where: { id: choreId },
        include: {
          assignedUsers: { include: { user: true } },
          subtasks: true,
        },
      });

      if (!updatedChore) {
        throw new NotFoundError("Chore not found.");
      }
    }

    const transformedChore = transformChoreToChoreWithAssignees(updatedChore);
    const transformedSwapRequest =
      transformChoreSwapRequest(updatedSwapRequest);

    if (approved) {
      getIO().to(`household_${householdId}`).emit("chore_swap_approved", {
        choreId,
        updatedChore: transformedChore,
        swapRequest: transformedSwapRequest,
      });
    } else {
      getIO().to(`household_${householdId}`).emit("chore_swap_rejected", {
        choreId,
        swapRequest: transformedSwapRequest,
      });
    }

    return wrapResponse(transformedChore);
  });
}
