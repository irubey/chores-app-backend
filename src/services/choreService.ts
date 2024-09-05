import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createChore = async (householdId: string, userId: string, choreData: any) => {
  const membership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this household');
  }

  return prisma.chore.create({
    data: {
      household_id: householdId,
      ...choreData,
      status: 'PENDING',
    },
  });
};

export const getHouseholdChores = async (householdId: string, userId: string) => {
  const membership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this household');
  }

  return prisma.chore.findMany({
    where: { household_id: householdId },
    include: { assigned_user: true },
  });
};

export const getChoreDetails = async (choreId: string) => {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      assigned_user: true,
      activities: {
        orderBy: { created_at: 'desc' },
        take: 10,
      },
    },
  });

  if (!chore) {
    throw new Error('Chore not found');
  }

  return chore;
};

export const updateChore = async (choreId: string, choreData: any) => {
  return prisma.chore.update({
    where: { id: choreId },
    data: choreData,
  });
};

export const deleteChore = async (choreId: string) => {
  return prisma.chore.delete({
    where: { id: choreId },
  });
};

export const completeChore = async (choreId: string, userId: string) => {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: { household: true },
  });

  if (!chore) {
    throw new Error('Chore not found');
  }

  const membership = await prisma.householdMember.findFirst({
    where: {
      household_id: chore.household_id,
      user_id: userId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this household');
  }

  return prisma.chore.update({
    where: { id: choreId },
    data: {
      status: 'COMPLETED',
      last_completed: new Date(),
      activities: {
        create: {
          user_id: userId,
          action: 'COMPLETED',
        },
      },
    },
  });
};