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
  ChoreSwapRequestStatus,
  ExpenseCategory,
  ReactionType,
  RecurrenceFrequency,
  EventReminderType,
  ChoreAction,
  PollStatus,
  PollType,
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
    await prisma.pollVote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.choreHistory.deleteMany();
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
  const messages = await createMessagesAndThreads(household.id, users);

  // Create events
  await createEvents(household.id, users);

  // Create notifications
  await createNotifications(users);

  // Create OAuth integrations
  await createOAuthIntegrations(users[0].id);

  // New additions
  await createChoreSwapRequests(chores, users);

  await createReceipts(expenses);

  await createNotificationSettings(users, household.id);

  await createPollsAndVotes(users, messages);

  console.log("Database has been seeded. 🌱");
}

async function createUsers(): Promise<any[]> {
  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const userData = [
    { email: "alice@example.com", name: "Alice Johnson" },
    { email: "bob@example.com", name: "Bob Smith" },
    { email: "charlie@example.com", name: "Charlie Brown" },
    { email: "diana@example.com", name: "Diana Prince" },
    { email: "edward@example.com", name: "Edward Blake" },
    { email: "fiona@example.com", name: "Fiona Apple" },
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
  // Create multiple households
  const households = await Promise.all([
    prisma.household.create({
      data: {
        name: "Awesome Apartment",
        members: {
          create: [
            {
              userId: users[0].id,
              role: HouseholdRole.ADMIN,
              isAccepted: true,
            },
            {
              userId: users[1].id,
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
            {
              userId: users[2].id,
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
          ],
        },
      },
    }),
    prisma.household.create({
      data: {
        name: "Student House",
        members: {
          create: [
            {
              userId: users[3].id,
              role: HouseholdRole.ADMIN,
              isAccepted: true,
            },
            {
              userId: users[4].id,
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
            {
              userId: users[5].id,
              role: HouseholdRole.MEMBER,
              isInvited: true,
            },
          ],
        },
      },
    }),
  ]);

  return households[0]; // Return first household for backward compatibility
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
    // Create the chore first without assignments
    const createdChore = await prisma.chore.create({
      data: {
        householdId,
        ...choreData,
        subtasks: {
          create: [
            {
              title: "Gather cleaning supplies",
              status: SubtaskStatus.PENDING,
            },
            {
              title: "Clean surfaces",
              status: SubtaskStatus.PENDING,
            },
            {
              title: "Put away cleaning supplies",
              status: SubtaskStatus.PENDING,
            },
          ],
        },
      },
    });

    // Create assignments separately
    await Promise.all(
      assignedUserIds.map((userId) =>
        prisma.choreAssignment.create({
          data: {
            choreId: createdChore.id,
            userId: userId,
          },
        })
      )
    );

    createdChores.push(createdChore);
  }

  // Add chore history
  await prisma.choreHistory.create({
    data: {
      choreId: createdChores[0].id,
      action: ChoreAction.CREATED,
      changedById: users[0].id,
    },
  });

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
      category: ExpenseCategory.FOOD,
    },
    {
      amount: 30.0,
      description: "Cleaning supplies",
      paidById: users[1].id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      category: ExpenseCategory.OTHER,
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
  type Message = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    authorId: string;
    threadId: string;
    content: string;
  };

  const threads = await Promise.all([
    prisma.thread.create({
      data: {
        householdId,
        authorId: users[0].id,
        title: "Cleaning Schedule Discussion",
        participants: {
          connect: users.slice(0, 3).map((user) => ({
            userId_householdId: {
              userId: user.id,
              householdId,
            },
          })),
        },
      },
    }),
    prisma.thread.create({
      data: {
        householdId,
        authorId: users[1].id,
        title: "Weekend Party Planning",
        participants: {
          connect: users.slice(0, 3).map((user) => ({
            userId_householdId: {
              userId: user.id,
              householdId,
            },
          })),
        },
      },
    }),
  ]);

  const messages: Message[] = [];

  // Create messages for first thread
  const message1 = await prisma.message.create({
    data: {
      threadId: threads[0].id,
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
  messages.push(message1);

  // Add reactions to first message
  await prisma.reaction.createMany({
    data: [
      {
        messageId: message1.id,
        userId: users[1].id,
        emoji: "👍",
        type: ReactionType.LIKE,
      },
      {
        messageId: message1.id,
        userId: users[2].id,
        emoji: "❤️",
        type: ReactionType.LOVE,
      },
    ],
  });

  // Create message with mentions
  const message2 = await prisma.message.create({
    data: {
      threadId: threads[0].id,
      authorId: users[1].id,
      content:
        "Hey @Alice and @Charlie, can we move the cleaning day to Saturday?",
      mentions: {
        create: [{ userId: users[0].id }, { userId: users[2].id }],
      },
    },
  });
  messages.push(message2);

  // Create message with poll
  const message3 = await prisma.message.create({
    data: {
      threadId: threads[1].id,
      authorId: users[0].id,
      content: "When should we have our house party?",
    },
  });

  const poll = await prisma.poll.create({
    data: {
      messageId: message3.id,
      question: "Best weekend for the party?",
      pollType: PollType.EVENT_DATE,
      maxChoices: 1,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: PollStatus.OPEN,
      options: {
        create: [
          {
            text: "Next Saturday 8PM",
            order: 1,
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
            ),
          },
          {
            text: "Next Sunday 7PM",
            order: 2,
            startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
            endTime: new Date(
              Date.now() + 8 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
            ),
          },
        ],
      },
    },
  });

  // Add some votes to the poll
  const options = await prisma.pollOption.findMany({
    where: { pollId: poll.id },
  });

  await prisma.pollVote.createMany({
    data: [
      {
        optionId: options[0].id,
        pollId: poll.id,
        userId: users[0].id,
        availability: true,
      },
      {
        optionId: options[1].id,
        pollId: poll.id,
        userId: users[1].id,
        availability: true,
      },
    ],
  });

  // Create some unread messages
  await prisma.message.create({
    data: {
      threadId: threads[1].id,
      authorId: users[2].id,
      content: "I'll bring snacks and drinks!",
      reads: {
        create: [
          { userId: users[2].id }, // Only the author has read it
        ],
      },
    },
  });

  return messages;
}

async function createEvents(householdId: string, users: any[]) {
  const monthlyRule = await prisma.recurrenceRule.create({
    data: {
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      byWeekDay: [],
      byMonthDay: [],
    },
  });

  await prisma.event.create({
    data: {
      householdId,
      title: "House Meeting",
      description: "Monthly catch-up and planning session",
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      createdById: users[0].id,
      category: EventCategory.MEETING,
      status: EventStatus.SCHEDULED,
      recurrenceRuleId: monthlyRule.id,
      isAllDay: false,
      isPrivate: false,
      reminders: {
        create: {
          time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          type: EventReminderType.PUSH_NOTIFICATION,
        },
      },
    },
  });
}

async function createNotifications(users: any[]) {
  await prisma.notification.createMany({
    data: [
      {
        userId: users[0].id,
        type: NotificationType.CHORE_ASSIGNED,
        message: "New chore assigned: Clean the kitchen",
        isRead: false,
      },
      {
        userId: users[1].id,
        type: NotificationType.EXPENSE_UPDATED,
        message: "New expense added: Groceries ($50.00)",
        isRead: false,
      },
      {
        userId: users[2].id,
        type: NotificationType.NEW_MESSAGE,
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

async function createNotificationSettings(users: any[], householdId: string) {
  for (const user of users) {
    await prisma.notificationSettings.create({
      data: {
        userId: user.id,
        householdId,
        messageNotif: true,
        mentionsNotif: true,
        reactionsNotif: true,
        choreNotif: true,
        financeNotif: true,
        calendarNotif: true,
        remindersNotif: true,
      },
    });
  }
}

async function createPollsAndVotes(users: any[], messages: any[]) {
  const poll = await prisma.poll.create({
    data: {
      messageId: messages[0].id,
      question: "When should we schedule the next house meeting?",
      pollType: PollType.EVENT_DATE,
      maxChoices: 1,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: PollStatus.OPEN,
      options: {
        create: [
          {
            text: "Next Monday 6PM",
            order: 1,
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
            ),
          },
          {
            text: "Next Tuesday 7PM",
            order: 2,
            startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
            endTime: new Date(
              Date.now() + 8 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
            ),
          },
        ],
      },
    },
  });

  // Create some votes
  const options = await prisma.pollOption.findMany({
    where: { pollId: poll.id },
  });

  await prisma.pollVote.create({
    data: {
      optionId: options[0].id,
      pollId: poll.id,
      userId: users[0].id,
      availability: true,
    },
  });
}

main()
  .catch((e) => {
    console.error("Error seeding the database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
