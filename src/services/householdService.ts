import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const createHousehold = async (name: string, userId: string) => {
  return prisma.household.create({
    data: {
      id: uuidv4(),
      name,
      created_at: new Date(),
      members: {
        create: {
          user_id: userId,
          role: 'ADMIN',
          joined_at: new Date(),
        },
      },
    },
    include: {
      members: true,
    },
  });
};

export const getHouseholds = async (userId: string) => {
  const households = await prisma.household.findMany({
    where: {
      members: {
        some: {
          user_id: userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return households.map(household => ({
    id: household.id,
    name: household.name,
    members: household.members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      role: member.role,
    })),
    status: 'ACTIVE',
  }));
};

export const addHouseholdMember = async (householdId: string, inviterId: string, email: string, role: 'ADMIN' | 'MEMBER') => {
  const inviterMembership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: inviterId,
    },
  });

  if (!inviterMembership) {
    throw new Error('You are not a member of this household');
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!invitedUser) {
    throw new Error('User not found');
  }

  const existingMembership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: invitedUser.id,
    },
  });

  if (existingMembership) {
    throw new Error('User is already a member of this household');
  }

  return prisma.householdMember.create({
    data: {
      household_id: householdId,
      user_id: invitedUser.id,
      role,
      joined_at: new Date(),
    },
  });
};

export const removeHouseholdMember = async (householdId: string, removerId: string, userIdToRemove: string) => {
  const removerMembership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: removerId,
      role: 'ADMIN',
    },
  });

  if (!removerMembership) {
    throw new Error('You do not have permission to remove members');
  }

  return prisma.householdMember.deleteMany({
    where: {
      household_id: householdId,
      user_id: userIdToRemove,
    },
  });
};