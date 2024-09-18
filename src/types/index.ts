import { Request } from 'express';
import {
  ChoreStatus,
  SubtaskStatus,
  NotificationType,
  TransactionStatus,
  Provider,
  User,
  Household,
  HouseholdMember,
  Message,
  Thread,
  Attachment,
  Chore,
  Subtask,
  Expense,
  Event,
  ExpenseSplit,
  Notification as PrismaNotification,
} from '@prisma/client';

// Enums
/**
 * Defines the OAuth providers supported for authentication.
 */
export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE',
}

/**
 * Defines the roles a user can have within a household.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

/**
 * Defines the possible statuses of a household.
 */
export enum HouseholdStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Defines the frequency options for recurring chores.
 */
export enum ChoreFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

/**
 * Defines the priority levels for chores.
 */
export enum ChorePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Defines the types of transactions for shared funds.
 */
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

/**
 * Defines the possible statuses of an invitation.
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

// Interfaces

/**
 * Extends the Express Request interface to include authenticated user information.
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
  cookies: {
    refreshToken?: string;
  };
}

/**
 * Defines the payload structure for JWT tokens.
 */
export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Extends the TokenPayload interface for OAuth-specific information.
 */
export interface OAuthTokenPayload extends TokenPayload {
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Defines options for pagination in API responses.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Data Transfer Objects (DTOs)

/**
 * DTO for creating a new expense split.
 */
export interface CreateExpenseSplitDTO {
  userId: string;
  amount: number;
}

/**
 * DTO for creating a new expense.
 */
export interface CreateExpenseDTO {
  householdId: string;
  amount: number;
  description: string;
  paidById: string;
  dueDate?: Date;
  category?: string;
  splits?: CreateExpenseSplitDTO[];
}

/**
 * DTO for updating an existing expense.
 */
export interface UpdateExpenseDTO {
  amount?: number;
  description?: string;
  dueDate?: Date;
  category?: string;
  splits?: UpdateExpenseSplitDTO[];
}

/**
 * DTO for updating an expense split.
 */
export interface UpdateExpenseSplitDTO {
  userId: string;
  amount: number;
}

/**
 * DTO for creating a new chore.
 */
export interface CreateChoreDTO {
  title: string;
  description?: string;
  householdId: string;
  dueDate?: Date;
  status?: ChoreStatus;
  recurrence?: string;
  priority?: number;
  assignedUserIds?: string[];
  subtasks?: CreateSubtaskDTO[];
}

/**
 * DTO for updating an existing chore.
 */
export interface UpdateChoreDTO {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: ChoreStatus;
  recurrence?: string;
  priority?: number;
  assignedUserIds?: string[];
  subtasks?: UpdateSubtaskDTO[];
}

/**
 * DTO for creating a new subtask.
 */
export interface CreateSubtaskDTO {
  choreId: string;
  title: string;
  status?: SubtaskStatus;
}

/**
 * DTO for updating an existing subtask.
 */
export interface UpdateSubtaskDTO {
  title?: string;
  status?: SubtaskStatus;
}

/**
 * DTO for creating a new household.
 */
export interface CreateHouseholdDTO {
  name: string;
}

/**
 * DTO for updating an existing household.
 */
export interface UpdateHouseholdDTO {
  name?: string;
}

/**
 * DTO for adding a new member to a household.
 */
export interface AddMemberDTO {
  userId: string;
  role?: UserRole;
}

/**
 * DTO for creating a new message.
 */
export interface CreateMessageDTO {
  householdId: string;
  authorId: string;
  content: string;
}

/**
 * DTO for creating a new thread.
 */
export interface CreateThreadDTO {
  messageId: string;
  authorId: string;
  content: string;
}

/**
 * DTO for creating a new event.
 */
export interface CreateEventDTO {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  createdById: string;
  choreId?: string | null;
}

/**
 * DTO for updating an existing event.
 */
export interface UpdateEventDTO {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  choreId?: string | null;
}

/**
 * DTO for syncing with a personal calendar.
 */
export interface SyncCalendarDTO {
  provider: OAuthProvider;
  accessToken: string;
}

/**
 * DTO for registering a new user.
 */
export interface RegisterUserDTO {
  email: string;
  password: string;
  name: string;
}

/**
 * DTO for user login credentials.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * DTO for creating a new notification.
 */
export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  message: string;
  isRead?: boolean;
}

/**
 * DTO for updating an existing notification.
 */
export interface UpdateNotificationDTO {
  isRead?: boolean;
}

/**
 * DTO for creating a new OAuth integration.
 */
export interface OAuthIntegrationDTO {
  userId: string;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * DTO for creating a new transaction.
 */
export interface CreateTransactionDTO {
  expenseId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status?: TransactionStatus;
}

/**
 * DTO for updating an existing transaction's status.
 */
export interface UpdateTransactionDTO {
  status: TransactionStatus;
}

// Utility Types
export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export type HouseholdWithMembers = Household & {
  members: HouseholdMember[];
};

export type ChoreWithAssignees = Chore & {
  assignedUsers: User[];
  subtasks: Subtask[];
};

export type MessageWithThreads = Message & {
  threads: Thread[];
  attachments: Attachment[];
};

export type EventWithChore = Event & {
  chore?: Chore;
};

/**
 * Extends the Notification interface to include user details.
 */
export type NotificationWithUser = PrismaNotification & {
  user: User;
};

// Socket Event Types
export interface NotificationEvent {
  type: NotificationType;
  message: string;
  userId: string;
}

export interface ChoreUpdateEvent {
  chore: Chore;
}

export interface MessageEvent {
  message: Message;
}

// New Interfaces and DTOs for Messaging

/**
 * DTO for creating a new message.
 */
export interface CreateMessageDTO {
  content: string;
  attachments?: CreateAttachmentDTO[];
}

/**
 * DTO for updating an existing message.
 */
export interface UpdateMessageDTO {
  content?: string;
  attachments?: CreateAttachmentDTO[];
}

/**
 * DTO for creating a new thread.
 */
export interface CreateThreadDTO {
  content: string;
}

/**
 * DTO for creating a new attachment.
 */
export interface CreateAttachmentDTO {
  url: string;
  fileType: string;
}

/**
 * Extends the Message interface to include author details.
 */
export type MessageWithDetails = Message & {
  author: User;
  threads: Thread[];
  attachments: Attachment[];
};

/**
 * Extends the Thread interface to include author and attachments.
 */
export type ThreadWithDetails = Thread & {
  author: User;
  attachments: Attachment[];
};

/**
 * Extends the Attachment interface to include optional relations.
 */
export type AttachmentWithDetails = Attachment & {
  message?: Message;
  thread?: Thread;
};

export interface HouseholdUpdateEvent {
  household: Household;
}

export interface ExpenseUpdateEvent {
  expense: Expense;
}

export interface EventUpdateEvent {
  event: Event;
}

// Partial types for flexible updates
export type PartialUpdateChoreDTO = Partial<UpdateChoreDTO>;
export type ChorePickDTO = Pick<Chore, 'id' | 'title' | 'status'>;


// Expense with splits for reminders
export type ExpenseWithSplits = Expense & {
  splits: (ExpenseSplit & {
    user: User;
  })[];
};


// Prisma Models and enums Export
export {
  User,
  Household,
  HouseholdRole,
  HouseholdMember,
  Message,
  Thread,
  Attachment,
  Chore,
  Subtask,
  Expense,
  ExpenseSplit,
  Transaction,
  Event,
  Notification as PrismaNotification,
  OAuthIntegration,
  ChoreStatus,
  SubtaskStatus,
  TransactionStatus,
  NotificationType,
  Provider,
} from '@prisma/client';


