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
} from "../utils/transformers/transformerPrismaTypes";
import { verifyMembership } from "./authService";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Helper function to create history record
async function createChoreHistory(
  tx: any,
  choreId: string,
  action: ChoreAction,
  userId: string
): Promise<void> {
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

  const chore = (await prisma.$transaction(async (tx) => {
    const createdChore = await tx.chore.create({
      data: {
        householdId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority,
        status: data.status || ChoreStatus.PENDING,
        recurrenceRuleId: data.recurrenceRuleId,
        assignedUsers: {
          create:
            data.assignedUserIds?.map((userId) => ({
              userId,
              assignedAt: new Date(),
            })) || [],
        },
        subtasks: {
          create:
            data.subtasks?.map((subtask) => ({
              title: subtask.title,
              description: subtask.description ?? null,
              status: subtask.status ?? SubtaskStatus.PENDING,
            })) || [],
        },
      },
      include: {
        subtasks: true,
        assignedUsers: {
          include: { user: true },
        },
      },
    });

    await tx.choreHistory.create({
      data: {
        choreId: createdChore.id,
        action: ChoreAction.CREATED,
        changedById: userId,
      },
    });

    return createdChore;
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

  const chore = (await prisma.$transaction(async (tx) => {
    const updatedChore = await tx.chore.update({
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
              create: data.subtasks.map((subtask) => ({
                title: subtask.title,
                description: subtask.description ?? null,
                status: subtask.status ?? SubtaskStatus.PENDING,
              })),
            }
          : undefined,
      },
      include: {
        subtasks: true,
        assignedUsers: {
          include: { user: true },
        },
      },
    });

    await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);

    return updatedChore;
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

  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: { event: true },
  });

  if (!chore) {
    throw new NotFoundError("Chore not found");
  }

  await prisma.$transaction(async (tx) => {
    // Cancel any pending swap requests
    await tx.choreSwapRequest.updateMany({
      where: {
        choreId,
        status: ChoreSwapRequestStatus.PENDING,
      },
      data: {
        status: ChoreSwapRequestStatus.REJECTED,
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
    await tx.choreHistory.create({
      data: {
        choreId,
        action: ChoreAction.DELETED,
        changedById: userId,
      },
    });
  });

  getIO()
    .to(`household_${householdId}`)
    .emit("chore_update", { choreId, deleted: true });
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

  const subtask = await prisma.$transaction(async (tx) => {
    const chore = await tx.chore.findUnique({
      where: { id: choreId },
      include: { subtasks: true },
    });

    if (!chore) {
      throw new NotFoundError("Chore not found.");
    }

    const createdSubtask = await tx.subtask.create({
      data: {
        choreId,
        title: data.title,
        description: data.description || null,
        status: data.status || SubtaskStatus.PENDING,
      },
    });

    // Update chore history
    await tx.choreHistory.create({
      data: {
        choreId,
        action: ChoreAction.UPDATED,
        changedById: userId,
      },
    });

    return createdSubtask as PrismaSubtask;
  });

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

  const subtask = await prisma.$transaction(async (tx) => {
    const updatedSubtask = await tx.subtask.update({
      where: { id: subtaskId },
      data: { status },
    });

    if (!updatedSubtask) {
      throw new NotFoundError("Subtask not found.");
    }

    // Check if all subtasks are completed
    const allSubtasks = await tx.subtask.findMany({
      where: { choreId },
    });

    const allCompleted = allSubtasks.every(
      (st) => st.status === SubtaskStatus.COMPLETED
    );

    if (allCompleted) {
      await tx.chore.update({
        where: { id: choreId },
        data: { status: ChoreStatus.COMPLETED },
      });
      await createChoreHistory(tx, choreId, ChoreAction.COMPLETED, userId);
    } else {
      await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);
    }

    return updatedSubtask as PrismaSubtask;
  });

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

  await prisma.$transaction(async (tx) => {
    const subtask = await tx.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask) {
      throw new NotFoundError("Subtask not found.");
    }

    await tx.subtask.delete({ where: { id: subtaskId } });

    // Create history record
    await tx.choreHistory.create({
      data: {
        choreId,
        action: ChoreAction.UPDATED,
        changedById: userId,
      },
    });
  });

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

  return prisma.$transaction(async (tx) => {
    const swapRequest = await tx.choreSwapRequest.findUnique({
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
      updatedChore = await tx.chore.update({
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

      updatedSwapRequest = await tx.choreSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: ChoreSwapRequestStatus.APPROVED },
      });

      await createChoreHistory(
        tx,
        choreId,
        ChoreAction.SWAPPED,
        approvingUserId
      );
    } else {
      updatedSwapRequest = await tx.choreSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: ChoreSwapRequestStatus.REJECTED },
      });

      updatedChore = await tx.chore.findUnique({
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
