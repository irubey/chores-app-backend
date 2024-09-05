import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllBadges = async () => {
  return prisma.badge.findMany();
};

export const getUserBadges = async (userId: string) => {
  const userWithBadges = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: {
        include: {
          badge: true,
        },
      },
    },
  });

  if (!userWithBadges) {
    throw new Error('User not found');
  }

  return userWithBadges.badges.map(ub => ub.badge);
};

export const awardBadge = async (userId: string, badgeId: string) => {
  const existingBadge = await prisma.userBadge.findUnique({
    where: {
      user_id_badge_id: {
        user_id: userId,
        badge_id: badgeId,
      },
    },
  });

  if (existingBadge) {
    throw new Error('User already has this badge');
  }

  return prisma.userBadge.create({
    data: {
      user_id: userId,
      badge_id: badgeId,
    },
    include: {
      badge: true,
    },
  });
};

export const revokeBadge = async (userId: string, badgeId: string) => {
  return prisma.userBadge.delete({
    where: {
      user_id_badge_id: {
        user_id: userId,
        badge_id: badgeId,
      },
    },
  });
};