import { PrismaClient, OAuthProvider, UserRole, ChoreFrequency} from '@prisma/client';

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
      preferences: {
        create: {
          theme: 'light',
        },
      },
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


  const presetChoreTemplates = [
    { title: "Vacuuming", description: "Vacuum all carpeted areas", time_estimate: 30, frequency: ChoreFrequency.WEEKLY, is_preset: true },
    { title: "Doing the dishes", description: "Wash and put away all dishes", time_estimate: 20, frequency: ChoreFrequency.DAILY, is_preset: true },
    { title: "Taking out the trash", description: "Empty all trash bins and replace bags", time_estimate: 10, frequency: ChoreFrequency.WEEKLY, is_preset: true },
    { title: "Cleaning the bathroom", description: "Clean toilet, sink, and shower/bathtub", time_estimate: 45, frequency: ChoreFrequency.WEEKLY, is_preset: true },
    { title: "Doing laundry", description: "Wash, dry, and fold clothes", time_estimate: 90, frequency: ChoreFrequency.WEEKLY, is_preset: true },
    { title: "Grocery shopping", description: "Buy groceries for the household", time_estimate: 60, frequency: ChoreFrequency.WEEKLY, is_preset: true },
    { title: "Mowing the lawn", description: "Mow the lawn and trim edges", time_estimate: 60, frequency: ChoreFrequency.WEEKLY, is_preset: true },
    { title: "Dusting furniture", description: "Dust all surfaces in common areas", time_estimate: 30, frequency: ChoreFrequency.WEEKLY, is_preset: true },
  ];

  for (const template of presetChoreTemplates) {
    await prisma.choreTemplate.upsert({
      where: { title: template.title },
      update: template,
      create: template,
    });
  }

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
