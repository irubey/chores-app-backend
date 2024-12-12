import { Subtask } from '@shared/types';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { CreateSubtaskDTO, UpdateSubtaskDTO } from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import {
  HouseholdRole,
  SubtaskStatus,
  ChoreAction,
  ChoreStatus,
} from '@shared/enums';
import { getIO } from '../sockets';
import { verifyMembership } from './authService';
import {
  transformSubtask,
  transformSubtaskInput,
  transformSubtaskUpdateInput,
} from '../utils/transformers/choreTransformer';
import { PrismaSubtaskWithFullRelations } from '../utils/transformers/transformerPrismaTypes';

function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

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

export async function addSubtask(
  householdId: string,
  choreId: string,
  data: CreateSubtaskDTO,
  userId: string
): Promise<ApiResponse<Subtask>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const subtask = await prisma.$transaction(async (tx) => {
    const chore = await tx.chore.findUnique({
      where: { id: choreId },
      include: { household: true },
    });

    if (!chore || chore.householdId !== householdId) {
      throw new NotFoundError('Chore not found in this household');
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
  getIO().to(`household_${householdId}`).emit('subtask_created', {
    choreId,
    subtask: transformedSubtask,
  });

  return wrapResponse(transformedSubtask);
}

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
    const chore = await tx.chore.findUnique({
      where: { id: choreId },
      include: { household: true },
    });

    if (!chore || chore.householdId !== householdId) {
      throw new NotFoundError('Chore not found in this household');
    }

    const updatedSubtask = await tx.subtask.update({
      where: { id: subtaskId },
      data: transformSubtaskUpdateInput(data, choreId),
      include: {
        chore: true,
      },
    });

    if (data.status === SubtaskStatus.COMPLETED) {
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
      }
    }

    await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);

    return updatedSubtask as PrismaSubtaskWithFullRelations;
  });

  const transformedSubtask = transformSubtask(subtask);
  getIO().to(`household_${householdId}`).emit('subtask_updated', {
    choreId,
    subtask: transformedSubtask,
  });

  return wrapResponse(transformedSubtask);
}

export async function deleteSubtask(
  householdId: string,
  choreId: string,
  subtaskId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.$transaction(async (tx) => {
    const chore = await tx.chore.findUnique({
      where: { id: choreId },
      include: { household: true },
    });

    if (!chore || chore.householdId !== householdId) {
      throw new NotFoundError('Chore not found in this household');
    }

    await tx.subtask.delete({
      where: { id: subtaskId },
    });

    await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);
  });

  getIO().to(`household_${householdId}`).emit('subtask_deleted', {
    choreId,
    subtaskId,
  });

  return wrapResponse(undefined);
}

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
    where: {
      id: choreId,
      householdId,
    },
    include: { subtasks: true },
  });

  if (!chore) {
    throw new NotFoundError('Chore not found in this household');
  }

  const transformedSubtasks = chore.subtasks.map((subtask) =>
    transformSubtask(subtask as PrismaSubtaskWithFullRelations)
  );

  return wrapResponse(transformedSubtasks);
}
