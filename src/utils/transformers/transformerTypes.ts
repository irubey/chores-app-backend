import {
  User,
  Chore,
  Subtask,
  Expense,
  ExpenseSplit,
  Transaction,
  Receipt,
  ExpenseHistory,
  Message,
  Thread,
  Attachment,
  Reaction,
  Event,
  EventReminder,
  Notification,
  HouseholdMember,
  Household,
  ChoreTemplate,
  SubtaskTemplate,
  ChoreHistory,
  CalendarEventHistory,
  NotificationSettings,
  Mention,
  MessageRead,
  RecurrenceRule,
} from "@shared/types";

// Base User type used across transformers
export type PrismaUser = Omit<User, "deletedAt" | "profileImageURL"> & {
  deletedAt: Date | null;
  profileImageURL: string | null;
};

// Chore related types
export type PrismaSubtask = Omit<Subtask, "description" | "status"> & {
  description: string | null;
  status: string;
};

export type PrismaChoreWithRelations = Omit<
  Chore,
  | "description"
  | "deletedAt"
  | "dueDate"
  | "priority"
  | "eventId"
  | "recurrenceRuleId"
  | "status"
> & {
  description: string | null;
  deletedAt: Date | null;
  dueDate: Date | null;
  priority: number | null;
  eventId: string | null;
  recurrenceRuleId: string | null;
  status: string;
  subtasks: PrismaSubtask[];
  assignedUsers: { user: PrismaUser }[];
};

export type PrismaChoreSwapRequest = {
  id: string;
  choreId: string;
  requestingUserId: string;
  targetUserId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

// Expense related types
export type PrismaExpense = Omit<
  Expense,
  "deletedAt" | "dueDate" | "category"
> & {
  deletedAt: Date | null;
  dueDate: Date | null;
  category: string;
  splits?: PrismaExpenseSplit[];
  paidBy?: PrismaUser;
};

export type PrismaExpenseSplit = Omit<ExpenseSplit, "user"> & {
  user?: PrismaUser;
};

export type PrismaTransaction = Omit<Transaction, "deletedAt" | "status"> & {
  deletedAt: Date | null;
  status: string;
};

export type PrismaReceipt = Receipt;

export type PrismaExpenseHistory = ExpenseHistory;

// Message related types
export type PrismaMessage = Omit<
  Message,
  "deletedAt" | "attachments" | "reactions" | "mentions" | "reads"
> & {
  deletedAt: Date | null;
  attachments: PrismaAttachment[] | null;
  reactions: PrismaReaction[] | null;
  mentions: PrismaMention[] | null;
  reads: PrismaMessageRead[] | null;
};

export type PrismaThread = Omit<Thread, "deletedAt" | "title"> & {
  deletedAt: Date | null;
  title: string | null;
};

export type PrismaAttachment = Omit<Attachment, "deletedAt"> & {
  deletedAt: Date | null;
};

export type PrismaReaction = Reaction;

export type PrismaMention = Mention;

export type PrismaMessageRead = MessageRead;

// Event related types
export type PrismaEvent = Omit<
  Event,
  "deletedAt" | "description" | "location" | "choreId" | "recurrenceRuleId"
> & {
  deletedAt: Date | null;
  description: string | null;
  location: string | null;
  choreId: string | null;
  recurrenceRuleId: string | null;
};

export type PrismaEventReminder = EventReminder;

// Household related types
export type PrismaHousehold = Omit<
  Household,
  "deletedAt" | "icon" | "currency" | "timezone" | "language"
> & {
  deletedAt: Date | null;
  icon: string | null;
  currency: string;
  timezone: string;
  language: string;
};

export type PrismaHouseholdMember = Omit<
  HouseholdMember,
  "leftAt" | "lastAssignedChoreAt"
> & {
  leftAt: Date | null;
  lastAssignedChoreAt: Date | null;
};

// Template related types
export type PrismaChoreTemplate = Omit<ChoreTemplate, "description"> & {
  description: string | null;
};

export type PrismaSubtaskTemplate = SubtaskTemplate;

// History related types
export type PrismaChoreHistory = ChoreHistory;
export type PrismaCalendarEventHistory = CalendarEventHistory;

// Notification related types
export type PrismaNotification = Notification;
export type PrismaNotificationSettings = NotificationSettings;

// RecurrenceRule related types
export type PrismaRecurrenceRule = Omit<
  RecurrenceRule,
  "bySetPos" | "count" | "until" | "customRuleString"
> & {
  bySetPos: number | null;
  count: number | null;
  until: Date | null;
  customRuleString: string | null;
};
