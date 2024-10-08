import {
  PrismaClient,
  HouseholdRole,
  ChoreStatus,
  SubtaskStatus,
  TransactionStatus,
  NotificationType,
  Provider,
  EventStatus,
  EventCategory,
  EventRecurrence,
  ReminderType,
  ChoreSwapRequestStatus,
  Chore,
  Expense,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Check if the database is already seeded
  const existingUsers = await prisma.user.findMany();
  if (existingUsers.length > 0) {
    console.log("Clearing existing data...");
    // Delete data in the correct order to avoid foreign key constraint issues
    await prisma.oAuthIntegration.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.thread.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.message.deleteMany();
    await prisma.subtask.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.choreSwapRequest.deleteMany(); // Add this line
    await prisma.chore.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.expenseSplit.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.event.deleteMany();
    await prisma.householdMember.deleteMany();
    await prisma.household.deleteMany();
    await prisma.user.deleteMany();
    console.log("Existing data cleared.");
  }

  // Create users
  const users = await createUsers();

  // Create household
  const household = await createHousehold(users);

  // Create chores
  const chores = await createChores(household.id, users);

  // Create expenses
  const expenses = await createExpenses(household.id, users);

  // Create messages and threads
  await createMessagesAndThreads(household.id, users);

  // Create events
  await createEvents(household.id, users);

  // Create notifications
  await createNotifications(users);

  // Create OAuth integrations
  await createOAuthIntegrations(users[0].id);

  // New additions
  await createChoreSwapRequests(chores, users);

  await createReceipts(expenses);

  console.log("Database has been seeded. 🌱");
}

async function createUsers(): Promise<any[]> {
  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const userData = [
    { email: "alice@example.com", name: "Alice Johnson" },
    { email: "bob@example.com", name: "Bob Smith" },
    { email: "charlie@example.com", name: "Charlie Brown" },
  ];

  const users = await Promise.all(
    userData.map((data) =>
      prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          name: data.name,
          profileImageURL: `https://example.com/profiles/${data.name
            .toLowerCase()
            .replace(" ", "_")}.jpg`,
          deviceTokens: ["sample_device_token"],
        },
      })
    )
  );

  return users;
}

async function createHousehold(users: any[]) {
  const household = await prisma.household.create({
    data: {
      name: "Awesome Apartment",
      members: {
        create: [
          { userId: users[0].id, role: HouseholdRole.ADMIN, isAccepted: true },
          { userId: users[1].id, role: HouseholdRole.MEMBER, isAccepted: true },
          { userId: users[2].id, role: HouseholdRole.MEMBER, isInvited: true },
        ],
      },
    },
  });

  return household;
}

async function createChores(
  householdId: string,
  users: any[]
): Promise<Chore[]> {
  const chores = [
    {
      title: "Clean the kitchen",
      description: "Wipe counters, clean sink, and mop floor",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: ChoreStatus.PENDING,
      priority: 2,
      assignedUserIds: [users[0].id, users[1].id],
    },
    {
      title: "Take out trash",
      description: "Empty all trash bins and take to dumpster",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: ChoreStatus.PENDING,
      priority: 1,
      assignedUserIds: [users[2].id],
    },
  ];

  const createdChores: Chore[] = [];

  for (const chore of chores) {
    const { assignedUserIds, ...choreData } = chore;
    const createdChore = await prisma.chore.create({
      data: {
        householdId,
        ...choreData,
        assignedUsers: {
          connect: assignedUserIds.map((id) => ({ id })),
        },
        subtasks: {
          create: [
            {
              title: "Gather cleaning supplies",
              status: SubtaskStatus.PENDING,
            },
            { title: "Clean surfaces", status: SubtaskStatus.PENDING },
            {
              title: "Put away cleaning supplies",
              status: SubtaskStatus.PENDING,
            },
          ],
        },
      },
    });
    createdChores.push(createdChore);
  }

  return createdChores;
}

async function createExpenses(
  householdId: string,
  users: any[]
): Promise<Expense[]> {
  const expenses = [
    {
      amount: 50.0,
      description: "Groceries",
      paidById: users[0].id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      category: "Food",
    },
    {
      amount: 30.0,
      description: "Cleaning supplies",
      paidById: users[1].id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      category: "Household",
    },
  ];

  const createdExpenses: Expense[] = [];

  for (const expense of expenses) {
    const createdExpense = await prisma.expense.create({
      data: {
        householdId,
        ...expense,
        splits: {
          create: users.map((user) => ({
            userId: user.id,
            amount: expense.amount / users.length,
          })),
        },
        transactions: {
          create: users
            .filter((user) => user.id !== expense.paidById)
            .map((user) => ({
              fromUserId: user.id,
              toUserId: expense.paidById,
              amount: expense.amount / users.length,
              status: TransactionStatus.PENDING,
            })),
        },
      },
    });
    createdExpenses.push(createdExpense);
  }

  return createdExpenses;
}

async function createMessagesAndThreads(householdId: string, users: any[]) {
  const message = await prisma.message.create({
    data: {
      householdId,
      authorId: users[0].id,
      content: "Hey everyone, let's discuss our cleaning schedule!",
      attachments: {
        create: {
          url: "https://example.com/cleaning_schedule.pdf",
          fileType: "application/pdf",
        },
      },
    },
  });

  await prisma.thread.createMany({
    data: [
      {
        messageId: message.id,
        authorId: users[1].id,
        content: "Sounds good! I'm free on weekends.",
      },
      {
        messageId: message.id,
        authorId: users[2].id,
        content: "I can take care of the kitchen on Wednesdays.",
      },
    ],
  });
}

async function createEvents(householdId: string, users: any[]) {
  await prisma.event.createMany({
    data: [
      {
        householdId,
        title: "House Meeting",
        description: "Monthly catch-up and planning session",
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ),
        createdById: users[0].id,
        category: EventCategory.MEETING,
        status: EventStatus.SCHEDULED,
        recurrence: EventRecurrence.MONTHLY,
      },
      {
        householdId,
        title: "Game Night",
        description: "Fun evening with board games",
        startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
        createdById: users[1].id,
        category: EventCategory.SOCIAL,
        status: EventStatus.SCHEDULED,
        recurrence: EventRecurrence.WEEKLY,
      },
    ],
  });
}

async function createNotifications(users: any[]) {
  await prisma.notification.createMany({
    data: [
      {
        userId: users[0].id,
        type: NotificationType.CHORE,
        message: "New chore assigned: Clean the kitchen",
        isRead: false,
      },
      {
        userId: users[1].id,
        type: NotificationType.EXPENSE,
        message: "New expense added: Groceries ($50.00)",
        isRead: false,
      },
      {
        userId: users[2].id,
        type: NotificationType.MESSAGE,
        message: "New message in Awesome Apartment",
        isRead: false,
      },
    ],
  });
}

async function createOAuthIntegrations(userId: string) {
  await prisma.oAuthIntegration.create({
    data: {
      userId,
      provider: Provider.GOOGLE,
      accessToken: "sample_access_token",
      refreshToken: "sample_refresh_token",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });
}

async function createChoreSwapRequests(chores: any[], users: any[]) {
  await prisma.choreSwapRequest.create({
    data: {
      choreId: chores[0].id,
      requestingUserId: users[0].id,
      targetUserId: users[1].id,
      status: ChoreSwapRequestStatus.PENDING,
    },
  });
}

async function createReceipts(expenses: any[]) {
  for (const expense of expenses) {
    await prisma.receipt.create({
      data: {
        expenseId: expense.id,
        url: `https://example.com/receipts/${expense.id}.jpg`,
        fileType: "image/jpeg",
      },
    });
  }
}

main()
  .catch((e) => {
    console.error("Error seeding the database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
