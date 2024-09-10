import { PrismaClient } from '@prisma/client';
import { OAuthProvider, UserRole, HouseholdStatus, ChoreStatus, ChoreFrequency, ChorePriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Seeding is only allowed in development environment');
    return;
  }

  // Create dev user
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      id: 'dev-user-id', // Match the ID used in devLogin
      email: 'dev@example.com',
      name: 'Dev User',
      oauth_provider: OAuthProvider.GOOGLE, // Or any provider you prefer
      oauth_id: 'dev_oauth_id',
      role: UserRole.ADMIN,
    },
  });

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      name: 'User One',
      oauth_provider: OAuthProvider.GOOGLE,
      oauth_id: 'google_123',
      role: UserRole.ADMIN,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      name: 'User Two',
      oauth_provider: OAuthProvider.FACEBOOK,
      oauth_id: 'facebook_456',
      role: UserRole.MEMBER,
    },
  });

  // Create a household for the dev user
  const devHousehold = await prisma.household.create({
    data: {
      name: 'Dev Household',
      status: HouseholdStatus.ACTIVE,
      members: {
        create: [
          { user_id: devUser.id, role: UserRole.ADMIN },
          { user_id: user1.id, role: UserRole.MEMBER },
          { user_id: user2.id, role: UserRole.MEMBER },
        ],
      },
    },
  });

  // Create chores
  await prisma.chore.createMany({
    data: [
      {
        household_id: devHousehold.id,
        title: 'Dev Chore 1',
        description: 'A chore for testing',
        time_estimate: 15,
        frequency: ChoreFrequency.DAILY,
        assigned_to: devUser.id,
        status: ChoreStatus.PENDING,
        priority: ChorePriority.MEDIUM,
      },
      {
        household_id: devHousehold.id,
        title: 'Dev Chore 2',
        description: 'Another chore for testing',
        time_estimate: 20,
        frequency: ChoreFrequency.WEEKLY,
        assigned_to: devUser.id,
        status: ChoreStatus.PENDING,
        priority: ChorePriority.HIGH,
      },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
