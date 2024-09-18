import prisma from '../config/database';
import { sendEmail } from '../utils/emailUtils';
import { sendPushNotification } from '../services/pushNotificationService';
import { ExpenseWithSplits } from '../types';

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
      },
      include: {
        assignedUsers: true,
      },
    });

    for (const chore of chores) {
      for (const user of chore.assignedUsers) {
        if (!chore.dueDate) {
          console.warn(`Chore "${chore.title}" has no due date.`);
          continue; // Skip sending reminder if no due date is set
        }

        const dueDate = chore.dueDate ? chore.dueDate.toDateString() : 'No due date set';
        const message = `Reminder: Chore "${chore.title}" is due on ${dueDate}.`;

        await sendEmail({
          to: user.email,
          subject: 'Chore Reminder',
          text: message,
        });

        await sendPushNotification(user.id, 'Chore Reminder', message);
      }
    }

    // Reminders for expenses
    const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: reminderTime,
        },
      },
      include: {
        splits: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const expense of expenses) {
      for (const split of expense.splits) {
        const message = `Reminder: You owe $${split.amount} for expense "${expense.description}" due on ${expense.dueDate?.toDateString() || 'No due date'}.`;

        await sendEmail({
          to: split.user.email,
          subject: 'Expense Reminder',
          text: message,
        });

        await sendPushNotification(split.user.id, 'Expense Reminder', message);
      }
    }

    console.log('Reminders sent successfully.');
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}