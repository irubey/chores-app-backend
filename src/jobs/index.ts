import cron from 'node-cron';
import { processNotifications } from './notificationJob';
import { scheduleRotatingChores } from './choreSchedulerJob';
import { sendReminders } from './reminderJob';

/**
 * Initializes all scheduled jobs.
 */
export function initializeJobs() {
  // Process notifications every minute
  cron.schedule('* * * * *', () => {
    console.log('Running notification job...');
    processNotifications();
  });

  // Schedule rotating chores every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running chore scheduler job...');
    scheduleRotatingChores();
  });

  // Send reminders every hour
  cron.schedule('0 * * * *', () => {
    console.log('Running reminder job...');
    sendReminders();
  });

  console.log('All jobs have been initialized.');
}

/*
# Jobs Directory Explanation

The `jobs` directory is designed to handle background tasks essential for the application's Must-Have features. These tasks include processing notifications, scheduling rotating chores, and sending reminders for upcoming chores and expenses. Here's a breakdown of each file and its purpose:

## 1. notificationJob.ts
- **Purpose**: Processes and sends pending notifications to users.
- **Functionality**:
  - Retrieves unread notifications from the database.
  - Sends email and push notifications based on the notification type.
  - Marks notifications as read after successful delivery.
- **Integration**: Utilizes existing `emailService` and `pushNotificationService` from the `services` directory.

## 2. choreSchedulerJob.ts
- **Purpose**: Automates the scheduling and assignment of rotating chores within households.
- **Functionality**:
  - Fetches households with recurring chores.
  - Assigns chores to household members based on predefined logic.
  - Creates new chore instances with appropriate assignments.
- **Integration**: Interacts with the `household` and `chore` models from the database.

## 3. reminderJob.ts
- **Purpose**: Sends timely reminders to users about upcoming chores and pending expenses.
- **Functionality**:
  - Identifies chores and expenses due within the next 24 hours.
  - Sends reminder emails and push notifications to relevant users.
- **Integration**: Leverages the `notificationService` for sending different types of notifications.

## 4. index.ts
- **Purpose**: Initializes and schedules all background jobs using `node-cron`.
- **Functionality**:
  - Sets up cron jobs to run:
    - `notificationJob` every minute for real-time notification processing.
    - `choreSchedulerJob` daily at midnight to handle chore rotations.
    - `reminderJob` hourly to ensure timely reminders.
- **Integration**: Acts as the entry point for all scheduled tasks, ensuring they run at the specified intervals.

## Additional Notes
- **Scalability**: The jobs are scheduled using `node-cron`, allowing for easy adjustments of execution frequencies based on application needs.
- **Error Handling**: Each job includes try-catch blocks to handle and log errors without crashing the entire application.
- **Service Integration**: Jobs utilize existing services from the `services` directory to perform their tasks, promoting code reusability and modularity.
- **Extensibility**: New jobs can be easily added to the directory and initialized in `index.ts` as the application grows and new background tasks become necessary.

By organizing background tasks within the `jobs` directory, the application ensures that critical operations related to user notifications, chore management, and expense reminders are handled efficiently and reliably.
*/
