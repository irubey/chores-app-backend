import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      oauth_provider: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const updateUserProfile = async (userId: string, name: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: {
      id: true,
      name: true,
      email: true,
      oauth_provider: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const getUserPreferences = async (userId: string) => {
  const preferences = await prisma.userPreference.findUnique({
    where: { user_id: userId },
  });

  if (!preferences) {
    throw new Error('User preferences not found');
  }

  return preferences;
};

export const updateUserPreferences = async (userId: string, preferencesData: any) => {
  return prisma.userPreference.upsert({
    where: { user_id: userId },
    update: preferencesData,
    create: { user_id: userId, ...preferencesData },
  });
};

export const getUserBadges = async (userId: string) => {
  const userWithBadges = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: true,
    },
  });

  if (!userWithBadges) {
    throw new Error('User not found');
  }

  return userWithBadges.badges;
};