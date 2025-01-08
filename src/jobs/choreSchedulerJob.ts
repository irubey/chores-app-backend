import prisma from "../config/database";
import {
  HouseholdRole,
  ChoreStatus,
  EventStatus,
  EventCategory,
  RecurrenceFrequency,
} from "@prisma/client";
import { CreateEventDTO, CreateChoreDTO } from "@shared/types";

/**
 * Automatically schedules rotating chores for households.
 */
export async function scheduleRotatingChores() {
  try {
    const households = await prisma.household.findMany({
      include: {
        members: {
          where: {
            leftAt: null,
            isAccepted: true,
          },
        },
        chores: {
          where: {
            recurrenceRuleId: {
              not: null,
            },
            deletedAt: null,
          },
          include: {
            recurrenceRule: true,
          },
        },
      },
    });

    for (const household of households) {
      const adminMember = household.members.find(
        (member) => member.role === HouseholdRole.ADMIN
      );

      if (!adminMember) {
        console.warn(`No admin found for household ${household.id}`);
        continue;
      }

      for (const chore of household.chores) {
        if (!chore.recurrenceRule) continue;

        const { frequency } = chore.recurrenceRule;
        let daysToAdd: number;

        switch (frequency) {
          case RecurrenceFrequency.DAILY:
            daysToAdd = 1;
            break;
          case RecurrenceFrequency.WEEKLY:
            daysToAdd = 7;
            break;
          case RecurrenceFrequency.BIWEEKLY:
            daysToAdd = 14;
            break;
          case RecurrenceFrequency.MONTHLY:
            daysToAdd = 30;
            break;
          case RecurrenceFrequency.YEARLY:
            daysToAdd = 365;
            break;
          default:
            continue;
        }

        await createChoreInstance(
          household.id,
          chore,
          daysToAdd,
          adminMember.userId
        );
      }
    }

    console.log("Rotating chores scheduled successfully.");
  } catch (error) {
    console.error("Error scheduling rotating chores:", error);
  }
}

/**
 * Creates a new instance of a chore and associated event.
 * @param householdId - The ID of the household.
 * @param chore - The chore to instantiate.
 * @param daysToAdd - Number of days to add for the next occurrence.
 * @param adminUserId - The ID of the admin user creating the instances.
 */
async function createChoreInstance(
  householdId: string,
  chore: any,
  daysToAdd: number,
  adminUserId: string
) {
  const members = await prisma.householdMember.findMany({
    where: {
      householdId,
      leftAt: null,
      isAccepted: true,
    },
  });

  if (members.length === 0) {
    console.warn(`No active members found in household ${householdId}`);
    return;
  }

  // Simple rotation logic based on the number of existing chore instances
  const assignedUser =
    members[Math.floor(Math.random() * members.length)].userId;

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day duration

  // Create the Event first
  const createdEvent = await prisma.event.create({
    data: {
      householdId,
      title: `Chore: ${chore.title}`,
      description: chore.description,
      startTime,
      endTime,
      createdById: adminUserId,
      category: EventCategory.CHORE,
      status: EventStatus.SCHEDULED,
      isAllDay: true,
      isPrivate: false,
      recurrenceRuleId: chore.recurrenceRuleId,
    },
  });

  // Now create the Chore and link it to the Event
  const createdChore = await prisma.chore.create({
    data: {
      householdId,
      title: chore.title,
      description: chore.description,
      dueDate: new Date(startTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
      status: ChoreStatus.PENDING,
      priority: chore.priority,
      eventId: createdEvent.id,
      recurrenceRuleId: chore.recurrenceRuleId,
      assignments: {
        create: [
          {
            userId: assignedUser,
            assignedAt: new Date(),
          },
        ],
      },
    },
  });

  console.log(
    `Chore "${chore.title}" assigned to user ${assignedUser} in household ${householdId}`
  );
  console.log(`Associated event created with ID: ${createdEvent.id}`);
}
