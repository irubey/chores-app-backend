import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import {
  CreateChoreDTO,
  UpdateChoreDTO,
  CreateSubtaskDTO,
  ChoreSwapRequest,
  Subtask,
  ChoreWithAssignees,
  ChoreAssignment,
  ChoreHistory,
  UpdateSubtaskDTO,
  CreateChoreSwapRequestDTO,
  UpdateChoreSwapRequestDTO,
  ChoreAssignmentWithUser,
  CreateChoreAssignmentDTO,
  UpdateChoreAssignmentDTO,
  ChorePickDTO,
  CreateChoreHistoryDTO,
  PartialUpdateChoreDTO,
  Chore,
} from '@shared/types';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import {
  HouseholdRole,
  ChoreStatus,
  ChoreSwapRequestStatus,
  SubtaskStatus,
  ChoreAction,
} from '@shared/enums';
import { getIO } from '../sockets';
import {
  transformChoreToChoreWithAssignees,
  transformChoresToChoresWithAssignees,
  transformSubtask,
  transformChoreSwapRequest,
  transformChoreAssignment,
  transformSubtaskInput,
  transformSubtaskUpdateInput,
} from '../utils/transformers/choreTransformer';
import {
  PrismaChoreWithFullRelations,
  PrismaSubtaskBase,
  PrismaSubtaskWithFullRelations,
  PrismaSubtaskMinimal,
  PrismaChoreSwapRequestWithRelations,
  PrismaChoreBase,
  PrismaChoreHistoryWithFullRelations,
  PrismaChoreAssignmentWithRelations,
} from '../utils/transformers/transformerPrismaTypes';
import { verifyMembership } from './authService';
import { addSubtask } from './subtaskService';

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
      assignments: {
        include: {
          user: true,
        },
      },
    },
  })) as PrismaChoreWithFullRelations[];

  const transformedChores = transformChoresToChoresWithAssignees(chores);
  return wrapResponse(transformedChores);
}

/**
 * Creates a new chore within a household.
 */
export async function createChore(
  householdId: string,
  data: CreateChoreDTO,
  userId: string
): Promise<ApiResponse<ChoreWithAssignees>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const chore = await prisma.$transaction(async (tx) => {
    const createdChore = (await tx.chore.create({
      data: {
        householdId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        status: data.status ?? ChoreStatus.PENDING,
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
    })) as PrismaChoreWithFullRelations;

    if (data.subtasks) {
      // Use subtaskService instead of direct creation
      for (const subtaskData of data.subtasks) {
        await addSubtask(householdId, createdChore.id, subtaskData, userId);
      }
    }

    await createChoreHistory(tx, createdChore.id, ChoreAction.CREATED, userId);

    return createdChore;
  });

  const transformedChore = transformChoreToChoreWithAssignees(chore);

  getIO()
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
      assignments: {
        include: { user: true },
      },
      choreSwapRequests: {
        where: { status: ChoreSwapRequestStatus.PENDING },
        include: {
          requestingUser: true,
          targetUser: true,
        },
      },
    },
  })) as PrismaChoreWithFullRelations;

  if (!chore) {
    throw new NotFoundError('Chore not found.');
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
        assignments: {
          deleteMany: {},
          create:
            data.assignments?.map((assignment) => ({
              userId: assignment.userId,
              assignedAt: new Date(),
            })) || [],
        },
        subtasks: data.subtasks
          ? {
            deleteMany: {},
            create: data.subtasks.map((subtask) =>
              transformSubtaskUpdateInput(subtask, choreId)
            ),
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

    await createChoreHistory(tx, choreId, ChoreAction.UPDATED, userId);

    return updatedChore;
  })) as PrismaChoreWithFullRelations;

  const transformedChore = transformChoreToChoreWithAssignees(chore);
  getIO()
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
export async function deleteChore(
  householdId: string,
  choreId: string,
  userId: string
): Promise<void> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  const chore = (await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      event: true,
      assignments: true,
      subtasks: true,
    },
  })) as PrismaChoreWithFullRelations;

  if (!chore) {
    throw new NotFoundError('Chore not found');
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
    await createChoreHistory(tx, choreId, ChoreAction.DELETED, userId);
  });

  getIO()
    .to(`household_${householdId}`)
    .emit('chore_update', { choreId, deleted: true });
}

/**
 * Creates a new chore swap request.
 */
export async function createChoreSwapRequest(
  householdId: string,
  data: CreateChoreSwapRequestDTO,
  requestingUserId: string
): Promise<ApiResponse<ChoreSwapRequest>> {
  await verifyMembership(householdId, requestingUserId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const swapRequest = (await prisma.$transaction(async (tx) => {
    const chore = await tx.chore.findUnique({
      where: { id: data.choreId },
      include: {
        assignments: true,
      },
    });

    if (!chore || chore.householdId !== householdId) {
      throw new NotFoundError('Chore not found in this household');
    }

    const existingAssignment = chore.assignments.find(
      (a) => a.userId === requestingUserId
    );
    if (!existingAssignment) {
      throw new UnauthorizedError('You are not assigned to this chore');
    }

    const createdSwapRequest = await tx.choreSwapRequest.create({
      data: {
        choreId: data.choreId,
        requestingUserId: requestingUserId,
        targetUserId: data.targetUserId,
        status: ChoreSwapRequestStatus.PENDING,
      },
      include: {
        chore: true,
        requestingUser: true,
        targetUser: true,
      },
    });

    await createChoreHistory(
      tx,
      data.choreId,
      ChoreAction.UPDATED,
      requestingUserId
    );

    return createdSwapRequest;
  })) as PrismaChoreSwapRequestWithRelations;

  const transformedSwapRequest = transformChoreSwapRequest(swapRequest);

  getIO()
    .to(`household_${householdId}`)
    .emit('chore_swap_request', { swapRequest: transformedSwapRequest });

  return wrapResponse(transformedSwapRequest);
}

/**
 * Approves or rejects a chore swap request.
 */
export async function approveOrRejectChoreSwap(
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

  const result = (await prisma.$transaction(async (tx) => {
    const swapRequest = await tx.choreSwapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        chore: true,
        requestingUser: true,
        targetUser: true,
      },
    });

    if (!swapRequest || swapRequest.choreId !== choreId) {
      throw new NotFoundError(
        'Swap request not found or does not match the chore.'
      );
    }

    if (swapRequest.targetUserId !== approvingUserId) {
      throw new UnauthorizedError(
        'You are not authorized to approve this swap request.'
      );
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
        data: { status: ChoreSwapRequestStatus.APPROVED },
      });

      await createChoreHistory(
        tx,
        choreId,
        ChoreAction.SWAPPED,
        approvingUserId
      );
    } else {
      await tx.choreSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: ChoreSwapRequestStatus.REJECTED },
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
  })) as PrismaChoreWithFullRelations;

  const transformedChore = transformChoreToChoreWithAssignees(result);

  if (approved) {
    getIO().to(`household_${householdId}`).emit('chore_swap_approved', {
      choreId,
      chore: transformedChore,
      swapRequestId,
    });
  } else {
    getIO().to(`household_${householdId}`).emit('chore_swap_rejected', {
      choreId,
      swapRequestId,
    });
  }

  return wrapResponse(transformedChore);
}
