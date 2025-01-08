"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRotatingChores = scheduleRotatingChores;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
/**
 * Automatically schedules rotating chores for households.
 */
async function scheduleRotatingChores() {
    try {
        const households = await database_1.default.household.findMany({
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
            const adminMember = household.members.find((member) => member.role === client_1.HouseholdRole.ADMIN);
            if (!adminMember) {
                console.warn(`No admin found for household ${household.id}`);
                continue;
            }
            for (const chore of household.chores) {
                if (!chore.recurrenceRule)
                    continue;
                const { frequency } = chore.recurrenceRule;
                let daysToAdd;
                switch (frequency) {
                    case client_1.RecurrenceFrequency.DAILY:
                        daysToAdd = 1;
                        break;
                    case client_1.RecurrenceFrequency.WEEKLY:
                        daysToAdd = 7;
                        break;
                    case client_1.RecurrenceFrequency.BIWEEKLY:
                        daysToAdd = 14;
                        break;
                    case client_1.RecurrenceFrequency.MONTHLY:
                        daysToAdd = 30;
                        break;
                    case client_1.RecurrenceFrequency.YEARLY:
                        daysToAdd = 365;
                        break;
                    default:
                        continue;
                }
                await createChoreInstance(household.id, chore, daysToAdd, adminMember.userId);
            }
        }
        console.log("Rotating chores scheduled successfully.");
    }
    catch (error) {
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
async function createChoreInstance(householdId, chore, daysToAdd, adminUserId) {
    const members = await database_1.default.householdMember.findMany({
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
    const assignedUser = members[Math.floor(Math.random() * members.length)].userId;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day duration
    // Create the Event first
    const createdEvent = await database_1.default.event.create({
        data: {
            householdId,
            title: `Chore: ${chore.title}`,
            description: chore.description,
            startTime,
            endTime,
            createdById: adminUserId,
            category: client_1.EventCategory.CHORE,
            status: client_1.EventStatus.SCHEDULED,
            isAllDay: true,
            isPrivate: false,
            recurrenceRuleId: chore.recurrenceRuleId,
        },
    });
    // Now create the Chore and link it to the Event
    const createdChore = await database_1.default.chore.create({
        data: {
            householdId,
            title: chore.title,
            description: chore.description,
            dueDate: new Date(startTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
            status: client_1.ChoreStatus.PENDING,
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
    console.log(`Chore "${chore.title}" assigned to user ${assignedUser} in household ${householdId}`);
    console.log(`Associated event created with ID: ${createdEvent.id}`);
}
