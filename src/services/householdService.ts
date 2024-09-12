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

export const joinHousehold = async (householdId: string, userId: string) => {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
  });

  if (!household) {
    throw new Error('Household not found');
  }

  const existingMembership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
    },
  });

  if (existingMembership) {
    throw new Error('You are already a member of this household');
  }

  await prisma.householdMember.create({
    data: {
      household_id: householdId,
      user_id: userId,
      role: 'MEMBER',
      joined_at: new Date(),
    },
  });

  return prisma.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
};

export const getHouseholdById = async (householdId: string) => {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: {
      members: {
        include: {
          user: {
            include: {
              badges: {
                include: {
                  badge: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!household) return null;

  return {
    id: household.id,
    name: household.name,
    members: household.members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      role: member.role,
      badges: member.user.badges.map(userBadge => userBadge.badge.name)
    })),
    status: household.status
  };
};

export const deleteHousehold = async (householdId: string, userId: string) => {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { members: true, chores: true }
  });

  if (!household) {
    throw new Error('Household not found');
  }

  const userMember = household.members.find(member => member.user_id === userId);

  if (!userMember || userMember.role !== 'ADMIN') {
    throw new Error('You do not have permission to delete this household');
  }

  // Delete related records
  await prisma.$transaction(async (prisma) => {
    // Delete ChoreActivity records
    await prisma.choreActivity.deleteMany({ 
      where: { chore: { household_id: householdId } } 
    });

    // Delete Chore records
    await prisma.chore.deleteMany({ where: { household_id: householdId } });

    // Delete HouseholdMember records
    await prisma.householdMember.deleteMany({ where: { household_id: householdId } });

    // Finally, delete the Household
    await prisma.household.delete({ where: { id: householdId } });
  });

  return household;
};

export const leaveHousehold = async (householdId: string, userId: string) => {
  const membership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
    },
    include: {
      household: {
        include: {
          members: true,
          chores: true
        }
      }
    }
  });

  if (!membership) {
    throw new Error('You are not a member of this household');
  }

  if (membership.role === 'ADMIN') {
    const otherAdmins = await prisma.householdMember.count({
      where: {
        household_id: householdId,
        role: 'ADMIN',
        NOT: {
          user_id: userId,
        },
      },
    });

    if (otherAdmins === 0) {
      throw new Error('You cannot leave the household as you are the only admin');
    }
  }

  await prisma.$transaction(async (prisma) => {
    // Remove user from assigned chores
    await prisma.chore.updateMany({
      where: {
        household_id: householdId,
        assigned_to: userId
      },
      data: {
        assigned_to: null
      }
    });

    // Delete user's chore activities in this household
    await prisma.choreActivity.deleteMany({
      where: {
        user_id: userId,
        chore: {
          household_id: householdId
        }
      }
    });

    // Delete the user's membership
    await prisma.householdMember.delete({
      where: {
        user_id_household_id: {
          user_id: userId,
          household_id: householdId,
        },
      },
    });
  });

  return membership.household;
};

export const isUserAdmin = async (householdId: string, userId: string): Promise<boolean> => {
  const membership = await prisma.householdMember.findFirst({
    where: {
      household_id: householdId,
      user_id: userId,
      role: 'ADMIN',
    },
  });

  return !!membership;
};
