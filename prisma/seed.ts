import {
  PrismaClient,
  HouseholdRole,
  ChoreStatus,
  EventCategory,
  RecurrenceFrequency,
  DaysOfWeek,
  SubtaskStatus,
  ChoreSwapRequestStatus,
  PollType,
  PollStatus,
  ReactionType,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.messageRead.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.mention.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.eventReminder.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.choreAssignment.deleteMany();
  await prisma.choreSwapRequest.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.event.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.household.deleteMany();
  await prisma.user.deleteMany();
  await prisma.recurrenceRule.deleteMany();

  // Create test users
  const password = await hash("password123", 10);

  const mainUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: password,
      name: "John Doe",
      profileImageURL: "https://ui-avatars.com/api/?name=John+Doe",
    },
  });

  const familyMembers = await Promise.all([
    prisma.user.create({
      data: {
        email: "jane@example.com",
        passwordHash: password,
        name: "Jane Doe",
        profileImageURL: "https://ui-avatars.com/api/?name=Jane+Doe",
      },
    }),
    prisma.user.create({
      data: {
        email: "kid@example.com",
        passwordHash: password,
        name: "Jimmy Doe",
        profileImageURL: "https://ui-avatars.com/api/?name=Jimmy+Doe",
      },
    }),
  ]);

  const roommateUser = await prisma.user.create({
    data: {
      email: "roommate@example.com",
      passwordHash: password,
      name: "Bob Smith",
      profileImageURL: "https://ui-avatars.com/api/?name=Bob+Smith",
    },
  });

  // Create Family Household
  const familyHousehold = await prisma.household.create({
    data: {
      name: "Doe Family Home",
      currency: "USD",
      timezone: "America/New_York",
      language: "en",
      icon: "🏠",
    },
  });

  // Create Roommate Household
  const roommateHousehold = await prisma.household.create({
    data: {
      name: "Downtown Apartment",
      currency: "USD",
      timezone: "America/New_York",
      language: "en",
      icon: "🏢",
    },
  });

  // Add members to Family Household
  await Promise.all([
    prisma.householdMember.create({
      data: {
        userId: mainUser.id,
        householdId: familyHousehold.id,
        role: HouseholdRole.ADMIN,
        isAccepted: true,
        nickname: "Dad",
      },
    }),
    ...familyMembers.map((member) =>
      prisma.householdMember.create({
        data: {
          userId: member.id,
          householdId: familyHousehold.id,
          role: HouseholdRole.MEMBER,
          isAccepted: true,
        },
      })
    ),
  ]);

  // Add members to Roommate Household
  await Promise.all([
    prisma.householdMember.create({
      data: {
        userId: mainUser.id,
        householdId: roommateHousehold.id,
        role: HouseholdRole.MEMBER,
        isAccepted: true,
      },
    }),
    prisma.householdMember.create({
      data: {
        userId: roommateUser.id,
        householdId: roommateHousehold.id,
        role: HouseholdRole.ADMIN,
        isAccepted: true,
      },
    }),
  ]);

  // Set active household for main user
  await prisma.user.update({
    where: { id: mainUser.id },
    data: { activeHouseholdId: familyHousehold.id },
  });

  // Create recurrence rules
  const weeklyRule = await prisma.recurrenceRule.create({
    data: {
      frequency: RecurrenceFrequency.WEEKLY,
      interval: 1,
      byWeekDay: [DaysOfWeek.MONDAY, DaysOfWeek.THURSDAY],
    },
  });

  const monthlyRule = await prisma.recurrenceRule.create({
    data: {
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      byMonthDay: [1, 15],
    },
  });

  // Create chores for Family Household
  const familyChores = await Promise.all([
    prisma.chore.create({
      data: {
        householdId: familyHousehold.id,
        title: "Clean Kitchen",
        description: "Wipe counters, clean dishes, sweep floor",
        status: ChoreStatus.PENDING,
        priority: 1,
        recurrenceRuleId: weeklyRule.id,
        assignments: {
          create: {
            userId: mainUser.id,
          },
        },
        subtasks: {
          createMany: {
            data: [
              { title: "Wipe counters", status: SubtaskStatus.PENDING },
              { title: "Load dishwasher", status: SubtaskStatus.PENDING },
              { title: "Sweep floor", status: SubtaskStatus.PENDING },
            ],
          },
        },
      },
    }),
    prisma.chore.create({
      data: {
        householdId: familyHousehold.id,
        title: "Vacuum Living Room",
        description: "Vacuum carpet and clean furniture",
        status: ChoreStatus.PENDING,
        priority: 2,
        recurrenceRuleId: monthlyRule.id,
        assignments: {
          create: {
            userId: familyMembers[0].id,
          },
        },
        subtasks: {
          createMany: {
            data: [
              { title: "Move furniture", status: SubtaskStatus.PENDING },
              { title: "Vacuum thoroughly", status: SubtaskStatus.PENDING },
              { title: "Clean under cushions", status: SubtaskStatus.PENDING },
            ],
          },
        },
      },
    }),
  ]);

  // Create chore swap request
  await prisma.choreSwapRequest.create({
    data: {
      choreId: familyChores[0].id,
      requestingUserId: mainUser.id,
      targetUserId: familyMembers[0].id,
      status: ChoreSwapRequestStatus.PENDING,
    },
  });

  // Create events for Family Household
  const familyEvents = await Promise.all([
    prisma.event.create({
      data: {
        householdId: familyHousehold.id,
        title: "Family Dinner",
        description: "Weekly family dinner",
        startTime: new Date("2024-01-01T18:00:00"),
        endTime: new Date("2024-01-01T19:30:00"),
        createdById: mainUser.id,
        category: EventCategory.SOCIAL,
        recurrenceRuleId: weeklyRule.id,
        reminders: {
          create: [
            {
              time: new Date("2024-01-01T17:30:00"),
              type: "PUSH_NOTIFICATION",
            },
            {
              time: new Date("2024-01-01T17:00:00"),
              type: "EMAIL",
            },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        householdId: familyHousehold.id,
        title: "House Cleaning Day",
        description: "Monthly deep cleaning",
        startTime: new Date("2024-01-15T09:00:00"),
        endTime: new Date("2024-01-15T12:00:00"),
        createdById: mainUser.id,
        category: EventCategory.CHORE,
        recurrenceRuleId: monthlyRule.id,
      },
    }),
  ]);

  // Create threads and messages
  const generalThread = await prisma.thread.create({
    data: {
      householdId: familyHousehold.id,
      authorId: mainUser.id,
      title: "General Discussion",
    },
  });

  // Create messages with poll
  const pollMessage = await prisma.message.create({
    data: {
      threadId: generalThread.id,
      authorId: mainUser.id,
      content: "When should we schedule our next family game night?",
    },
  });

  // Create poll
  const poll = await prisma.poll.create({
    data: {
      messageId: pollMessage.id,
      question: "Choose the best time for family game night",
      pollType: PollType.SINGLE_CHOICE,
      status: PollStatus.OPEN,
      endDate: new Date("2024-01-10"),
      options: {
        create: [
          { text: "Saturday 7 PM", order: 1 },
          { text: "Sunday 3 PM", order: 2 },
          { text: "Friday 8 PM", order: 3 },
        ],
      },
    },
  });

  // Add poll votes
  const pollOptions = await prisma.pollOption.findMany({
    where: { pollId: poll.id },
  });

  await Promise.all([
    prisma.pollVote.create({
      data: {
        optionId: pollOptions[0].id,
        pollId: poll.id,
        userId: mainUser.id,
      },
    }),
    prisma.pollVote.create({
      data: {
        optionId: pollOptions[0].id,
        pollId: poll.id,
        userId: familyMembers[0].id,
      },
    }),
  ]);

  // Create regular message with reactions
  const regularMessage = await prisma.message.create({
    data: {
      threadId: generalThread.id,
      authorId: familyMembers[0].id,
      content: "I finished cleaning the living room! 🎉",
    },
  });

  // Add reactions to the message
  await Promise.all([
    prisma.reaction.create({
      data: {
        messageId: regularMessage.id,
        userId: mainUser.id,
        emoji: "👍",
        type: ReactionType.LIKE,
      },
    }),
    prisma.reaction.create({
      data: {
        messageId: regularMessage.id,
        userId: familyMembers[1].id,
        emoji: "🎉",
        type: ReactionType.LOVE,
      },
    }),
  ]);

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
