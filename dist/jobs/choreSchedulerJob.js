import prisma from '../config/database';
import { HouseholdRole } from '@prisma/client';
import { ChoreFrequency } from '../types';
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
            const adminMember = household.members.find((member) => member.role === HouseholdRole.ADMIN);
            if (!adminMember) {
                console.warn(`No admin found for household ${household.id}`);
                continue;
            }
            for (const chore of household.chores) {
                switch (chore.recurrence) {
                    case ChoreFrequency.DAILY:
                        await createChoreInstance(household.id, chore);
                        break;
                    case ChoreFrequency.WEEKLY:
                        // Implement weekly scheduling logic
                        break;
                    case ChoreFrequency.MONTHLY:
                        // Implement monthly scheduling logic
                        break;
                    case ChoreFrequency.CUSTOM:
                        // Implement custom scheduling logic
                        break;
                    default:
                        break;
                }
            }
        }
        console.log('Rotating chores scheduled successfully.');
    }
    catch (error) {
        console.error('Error scheduling rotating chores:', error);
    }
}
/**
 * Creates a new instance of a chore.
 * @param householdId - The ID of the household.
 * @param chore - The chore to instantiate.
 */
async function createChoreInstance(householdId, chore) {
    // Logic to assign chore to a member
    const members = await prisma.householdMember.findMany({
        where: { householdId },
    });
    if (members.length === 0) {
        console.warn(`No members found in household ${householdId}`);
        return;
    }
    // Simple rotation logic based on the number of existing chore instances
    const assignedUser = members[Math.floor(Math.random() * members.length)].userId;
    await prisma.chore.create({
        data: {
            householdId,
            title: chore.title,
            description: chore.description,
            dueDate: new Date(), // Set appropriate due date
            status: 'PENDING',
            recurrence: chore.recurrence,
            priority: chore.priority,
            assignedUsers: {
                connect: [{ id: assignedUser }],
            },
        },
    });
    console.log(`Chore "${chore.title}" assigned to user ${assignedUser} in household ${householdId}.`);
}
