import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createChore = async (householdId: string, userId: string, choreData: any) => {
  console.log('Backend Service - Creating chore with data:', choreData);
  
  const membership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
    },
  });

  if (!membership) {
    throw new Error('You are not a member of this household');
  }

  // Handle the assignedTo field
  let assignedTo = choreData.assignedTo || [];
  if (assignedTo.length === 0) {
    assignedTo = null; // Assign to all if empty or not provided
  } else {
    // Verify that all assigned users are members of the household
    const validMembers = await prisma.householdMember.findMany({
      where: {
        household_id: householdId,
        user_id: { in: assignedTo },
      },
    });
    if (validMembers.length !== assignedTo.length) {
      throw new Error('One or more assigned users are not members of this household');
    }
  }

  const createdChore = await prisma.chore.create({
    data: {
      household: {
        connect: { id: householdId }
      },
      title: choreData.title,
      description: choreData.description,
      time_estimate: choreData.time_estimate,
      frequency: choreData.frequency,
      priority: choreData.priority,
      assigned_to: assignedTo,
      status: 'PENDING',
    },
  });

  console.log('Backend Service - Chore created:', createdChore);
  return createdChore;
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

  const chores = await prisma.chore.findMany({
    where: { household_id: householdId },
    include: {
      household: true,
    },
  });

  // If we need user details for assigned users, we can fetch them separately
  const userIds = new Set(chores.flatMap(chore => chore.assigned_to || []));
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, email: true },
  });

  const usersMap = new Map(users.map(user => [user.id, user]));

  return chores.map(chore => ({
    ...chore,
    assignedUsers: chore.assigned_to ? chore.assigned_to.map(id => usersMap.get(id)).filter(Boolean) : [],
  }));
};

export const getChoreDetails = async (choreId: string) => {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      household: true,
      activities: {
        orderBy: { created_at: 'desc' },
        take: 10,
      },
    },
  });

  if (!chore) {
    throw new Error('Chore not found');
  }

  // If we need user details for assigned users, we can fetch them separately
  if (chore.assigned_to && chore.assigned_to.length > 0) {
    const assignedUsers = await prisma.user.findMany({
      where: { id: { in: chore.assigned_to } },
      select: { id: true, name: true, email: true },
    });
    return { ...chore, assignedUsers };
  }

  return chore;
};

export const updateChore = async (choreId: string, choreData: any) => {
  const existingChore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: { household: true },
  });

  if (!existingChore) {
    throw new Error('Chore not found');
  }

  // Handle the assigned_to field
  let assignedTo = choreData.assigned_to;
  if (!assignedTo || (Array.isArray(assignedTo) && assignedTo.length === 0)) {
    assignedTo = null; // Assign to all if empty or not provided
  } else if (Array.isArray(assignedTo)) {
    // Verify that all assigned users are members of the household
    const validMembers = await prisma.householdMember.findMany({
      where: {
        household_id: existingChore.household_id,
        user_id: { in: assignedTo },
      },
    });
    if (validMembers.length !== assignedTo.length) {
      throw new Error('One or more assigned users are not members of this household');
    }
  } else {
    throw new Error('Invalid assigned_to field');
  }

  return prisma.chore.update({
    where: { id: choreId },
    data: {
      ...choreData,
      assigned_to: assignedTo,
    },
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