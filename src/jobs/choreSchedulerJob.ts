import prisma from '../config/database';
import { HouseholdRole, EventRecurrence, ChoreStatus, EventStatus, EventCategory } from '@prisma/client';

/**
 * Automatically schedules rotating chores for households.
 */
export async function scheduleRotatingChores() {
  try {
    const households = await prisma.household.findMany({
      include: {
        members: true,
        chores: {
          where: {
            recurrence: {
              not: null,
            },
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
        const recurrence = chore.recurrence as EventRecurrence;
        switch (recurrence) {
        case EventRecurrence.DAILY:
          await createChoreInstance(household.id, chore, 1);
          break;
        case EventRecurrence.WEEKLY:
          await createChoreInstance(household.id, chore, 7);
          break;
        case EventRecurrence.MONTHLY:
          await createChoreInstance(household.id, chore, 30);
          break;
        case EventRecurrence.YEARLY:
          await createChoreInstance(household.id, chore, 365);
          break;
        case EventRecurrence.CUSTOM:
          // Implement custom scheduling logic
          break;
        default:
          break;
        }
      }
    }

    console.log('Rotating chores scheduled successfully.');
  } catch (error) {
    console.error('Error scheduling rotating chores:', error);
  }
}

/**
 * Creates a new instance of a chore and associated event.
 * @param householdId - The ID of the household.
 * @param chore - The chore to instantiate.
 * @param daysToAdd - Number of days to add for the next occurrence.
 */
async function createChoreInstance(householdId: string, chore: any, daysToAdd: number) {
  const members = await prisma.householdMember.findMany({
    where: { householdId },
  });

  if (members.length === 0) {
    console.warn(`No members found in household ${householdId}`);
    return;
  }

  // Simple rotation logic based on the number of existing chore instances
  const assignedUser = members[Math.floor(Math.random() * members.length)].userId;

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
      createdById: assignedUser,
      recurrence: chore.recurrence as EventRecurrence,
      category: EventCategory.CHORE,
      status: EventStatus.SCHEDULED,
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
      recurrence: chore.recurrence,
      priority: chore.priority,
      eventId: createdEvent.id,
      assignedUsers: {
        connect: [{ id: assignedUser }],
      },
    },
  });

  console.log(`Chore "${chore.title}" assigned to user ${assignedUser} in household ${householdId}.`);
  console.log(`Associated event created with ID: ${createdEvent.id}`);
}