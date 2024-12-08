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
              userId: users[0].id, // Alice is admin
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
        name: "Beach House",
        members: {
          create: [
            {
              userId: users[3].id,
              role: HouseholdRole.ADMIN,
              isAccepted: true,
            },
            {
              userId: users[0].id, // Alice is member
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
            {
              userId: users[4].id,
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
          ],
        },
      },
    }),
    prisma.household.create({
      data: {
        name: "Mountain Cabin",
        members: {
          create: [
            {
              userId: users[5].id,
              role: HouseholdRole.ADMIN,
              isAccepted: true,
            },
            {
              userId: users[0].id, // Alice is member
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
            {
              userId: users[1].id,
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
          ],
        },
      },
    }),
    prisma.household.create({
      data: {
        name: "Downtown Loft",
        members: {
          create: [
            {
              userId: users[0].id, // Alice is admin
              role: HouseholdRole.ADMIN,
              isAccepted: true,
            },
            {
              userId: users[2].id,
              role: HouseholdRole.MEMBER,
              isAccepted: true,
            },
            {
              userId: users[4].id,
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

  const messages: Message[] = [];

  // Get all households
  const households = await prisma.household.findMany({
    include: {
      members: true,
    },
  });

  for (const household of households) {
    // Create threads for each household
    const threads = await Promise.all([
      prisma.thread.create({
        data: {
          householdId: household.id,
          authorId: household.members[0].userId,
          title: "General Discussion",
          participants: {
            connect: household.members.map((member) => ({
              userId_householdId: {
                userId: member.userId,
                householdId: household.id,
              },
            })),
          },
        },
      }),
      prisma.thread.create({
        data: {
          householdId: household.id,
          authorId: household.members[0].userId,
          title: `${household.name} Updates`,
          participants: {
            connect: household.members.map((member) => ({
              userId_householdId: {
                userId: member.userId,
                householdId: household.id,
              },
            })),
          },
        },
      }),
    ]);

    // Create messages for each thread
    for (const thread of threads) {
      // Welcome message
      const welcomeMsg = await prisma.message.create({
        data: {
          threadId: thread.id,
          authorId: household.members[0].userId,
          content: `Welcome to the ${thread.title} thread for ${household.name}!`,
        },
      });
      messages.push(welcomeMsg);

      // Add context-specific messages
      if (household.name === "Beach House") {
        await prisma.message.create({
          data: {
            threadId: thread.id,
            authorId: users[3].id,
            content: "Planning beach cleanup this weekend. Who's in?",
          },
        });
      } else if (household.name === "Mountain Cabin") {
        await prisma.message.create({
          data: {
            threadId: thread.id,
            authorId: users[5].id,
            content: "Need to check heating before winter. Any volunteers?",
          },
        });
      } else if (household.name === "Downtown Loft") {
        await prisma.message.create({
          data: {
            threadId: thread.id,
            authorId: users[0].id,
            content: "New house rules posted on the fridge!",
          },
        });
      }

      // Add Alice's responses where she's a member
      if (
        household.members.some(
          (m) => m.userId === users[0].id && m.role === HouseholdRole.MEMBER
        )
      ) {
        await prisma.message.create({
          data: {
            threadId: thread.id,
            authorId: users[0].id,
            content: "Count me in! Let me know how I can help.",
          },
        });
      }

      // Add some unread messages
      await prisma.message.create({
        data: {
          threadId: thread.id,
          authorId: household.members[household.members.length - 1].userId,
          content: "Just updated the shared calendar!",
          reads: {
            create: [
              {
                userId: household.members[household.members.length - 1].userId,
              },
            ],
          },
        },
      });
    }
  }

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
        type: NotificationType.NEW_MESSAGE,
        message: "You have new messages in your threads",
      },
      {
        userId: users[0].id,
        type: NotificationType.CHORE_ASSIGNED,
        message: "You have been assigned new chores",
      },
      {
        userId: users[0].id,
        type: NotificationType.EXPENSE_UPDATED,
        message: "New expense has been added to your household",
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

async function createChoreSwapRequests(chores: any[], users: any[]) {
  for (const chore of chores) {
    const assignments = await prisma.choreAssignment.findMany({
      where: { choreId: chore.id },
    });

    if (assignments.length >= 2) {
      await prisma.choreSwapRequest.create({
        data: {
          choreId: chore.id,
          requestingUserId: assignments[0].userId,
          targetUserId: assignments[1].userId,
          status: ChoreSwapRequestStatus.PENDING,
        },
      });
    }
  }
}

async function createReceipts(expenses: any[]) {
  for (const expense of expenses) {
    await prisma.receipt.create({
      data: {
        expenseId: expense.id,
        url: "https://example.com/receipts/sample.jpg",
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
  for (const message of messages) {
    // Create a poll for every third message
    if (messages.indexOf(message) % 3 === 0) {
      const poll = await prisma.poll.create({
        data: {
          messageId: message.id,
          question: "When should we meet?",
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
        include: {
          options: true,
        },
      });

      // Add some votes
      await Promise.all(
        poll.options.map((option, index) =>
          prisma.pollVote.create({
            data: {
              optionId: option.id,
              pollId: poll.id,
              userId: users[index].id,
              availability: true,
            },
          })
        )
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
