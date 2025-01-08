import prisma from "../config/database";
import { sendEmail } from "../utils/emailUtils";
import { sendPushNotification } from "../services/pushNotificationService";
import { ExpenseWithSplits, HouseholdExpense } from "@shared/types";
import { NotificationType } from "@prisma/client";

/**
 * Sends reminders for upcoming chores and expenses.
 */
export async function sendReminders() {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Reminders for chores
    const chores = await prisma.chore.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: reminderTime,
        },
        deletedAt: null,
        status: {
          not: "COMPLETED",
        },
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    for (const chore of chores) {
      for (const assignment of chore.assignments) {
        if (!chore.dueDate) {
          console.warn(`Chore "${chore.title}" has no due date.`);
          continue;
        }

        const dueDate = chore.dueDate.toDateString();
        const message = `Reminder: Chore "${chore.title}" in household "${chore.household.name}" is due on ${dueDate}.`;

        // Create notification
        await prisma.notification.create({
          data: {
            userId: assignment.user.id,
            type: NotificationType.CHORE_ASSIGNED,
            message,
            isRead: false,
          },
        });

        // Send email if user has an email
        if (assignment.user.email) {
          await sendEmail({
            to: assignment.user.email,
            subject: "Chore Reminder",
            text: message,
          });
        }

        // Send push notification if user has device tokens
        const userWithTokens = await prisma.user.findUnique({
          where: { id: assignment.user.id },
          select: { deviceTokens: true },
        });

        const deviceTokens = userWithTokens?.deviceTokens || [];
        if (deviceTokens.length > 0) {
          await sendPushNotification(
            assignment.user.id,
            "Chore Reminder",
            message,
            { type: "CHORE_REMINDER" }
          );
        }
      }
    }

    // Reminders for expenses
    const expenses = (await prisma.expense.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: reminderTime,
        },
        deletedAt: null,
      },
      include: {
        splits: {
          include: {
            user: true,
          },
        },
        household: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as (ExpenseWithSplits & HouseholdExpense)[];

    for (const expense of expenses) {
      for (const split of expense.splits) {
        const message = `Reminder: You owe $${split.amount.toFixed(
          2
        )} for expense "${expense.description}" in household "${
          expense.household.name
        }" due on ${expense.dueDate?.toDateString() || "No due date"}.`;

        // Create notification
        await prisma.notification.create({
          data: {
            userId: split.user.id,
            type: NotificationType.PAYMENT_REMINDER,
            message,
            isRead: false,
          },
        });

        // Send email if user has an email
        if (split.user.email) {
          await sendEmail({
            to: split.user.email,
            subject: "Expense Reminder",
            text: message,
          });
        }

        // Send push notification if user has device tokens
        const userWithTokens = await prisma.user.findUnique({
          where: { id: split.user.id },
          select: { deviceTokens: true },
        });

        const deviceTokens = userWithTokens?.deviceTokens || [];
        if (deviceTokens.length > 0) {
          await sendPushNotification(
            split.user.id,
            "Expense Reminder",
            message,
            { type: "EXPENSE_REMINDER" }
          );
        }
      }
    }

    console.log("Reminders sent successfully.");
  } catch (error) {
    console.error("Error sending reminders:", error);
  }
}
