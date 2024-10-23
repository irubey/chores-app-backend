import { Subtask } from "@shared/types";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import prisma from "../config/database";
import { CreateSubtaskDTO, UpdateSubtaskDTO } from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { HouseholdRole, SubtaskStatus, ChoreAction } from "@shared/enums";
import { getIO } from "../sockets";
import { verifyMembership } from "./authService";
import {
  transformSubtask,
  transformSubtaskInput,
  transformSubtaskUpdateInput,
} from "../utils/transformers/choreTransformer";
import { PrismaSubtaskWithFullRelations } from "../utils/transformers/transformerPrismaTypes";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Helper function to create chore history record
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
 * Adds a new subtask to a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param data - The subtask data.
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
    });

    if (!chore) {
      throw new NotFoundError("Chore not found.");
    }

    const createdSubtask = await tx.subtask.create({
      data: {
        ...transformSubtaskInput(data),
        choreId,
      },
      include: {
        chore: true,
      },
    });

    await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);

    return createdSubtask as PrismaSubtaskWithFullRelations;
  });

  const transformedSubtask = transformSubtask(subtask);
  getIO()
    .to(`household_${householdId}`)
    .emit("subtask_update", { subtask: transformedSubtask });

  return wrapResponse(transformedSubtask);
}

/**
 * Updates the status of an existing subtask.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask.
 * @param data - The updated subtask data.
 * @param userId - The ID of the user updating the subtask.
 * @returns The updated subtask.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function updateSubtask(
  householdId: string,
  choreId: string,
  subtaskId: string,
  data: UpdateSubtaskDTO,
  userId: string
): Promise<ApiResponse<Subtask>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const subtask = await prisma.$transaction(async (tx) => {
    const existingSubtask = await tx.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!existingSubtask || existingSubtask.choreId !== choreId) {
      throw new NotFoundError("Subtask not found.");
    }

    const updatedSubtask = await tx.subtask.update({
      where: { id: subtaskId },
      data: transformSubtaskUpdateInput(data, choreId),
    });

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
        data: { status: SubtaskStatus.COMPLETED },
      });
      await createChoreHistory(tx, choreId, ChoreAction.COMPLETED, userId);
    } else {
      await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);
    }

    return updatedSubtask as PrismaSubtaskWithFullRelations;
  });

  const transformedSubtask = transformSubtask(subtask);
  getIO()
    .to(`household_${householdId}`)
    .emit("subtask_update", { subtask: transformedSubtask });

  return wrapResponse(transformedSubtask);
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
export async function deleteSubtask(
  householdId: string,
  choreId: string,
  subtaskId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.$transaction(async (tx) => {
    const subtask = await tx.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask || subtask.choreId !== choreId) {
      throw new NotFoundError("Subtask not found.");
    }

    await tx.subtask.delete({ where: { id: subtaskId } });

    await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);
  });

  getIO()
    .to(`household_${householdId}`)
    .emit("subtask_update", { subtaskId, deleted: true });

  return wrapResponse(undefined);
}

/**
 * Retrieves all subtasks for a specific chore.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param userId - The ID of the requesting user.
 * @returns An array of subtasks.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the chore does not exist.
 */
export async function getSubtasks(
  householdId: string,
  choreId: string,
  userId: string
): Promise<ApiResponse<Subtask[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: { subtasks: true },
  });

  if (!chore) {
    throw new NotFoundError("Chore not found.");
  }

  const transformedSubtasks = chore.subtasks.map((subtask) =>
    transformSubtask(subtask as PrismaSubtaskWithFullRelations)
  );
  return wrapResponse(transformedSubtasks);
}

/**
 * Retrieves a specific subtask.
 * @param householdId - The ID of the household.
 * @param choreId - The ID of the chore.
 * @param subtaskId - The ID of the subtask.
 * @param userId - The ID of the requesting user.
 * @returns The requested subtask.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the subtask does not exist.
 */
export async function getSubtaskById(
  householdId: string,
  choreId: string,
  subtaskId: string,
  userId: string
): Promise<ApiResponse<Subtask>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
  });

  if (!subtask || subtask.choreId !== choreId) {
    throw new NotFoundError("Subtask not found.");
  }

  const transformedSubtask = transformSubtask(
    subtask as PrismaSubtaskWithFullRelations
  );
  return wrapResponse(transformedSubtask);
}
