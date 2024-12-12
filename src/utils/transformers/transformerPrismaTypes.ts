import { Prisma } from '@prisma/client';
import { HouseholdRole } from '@shared/enums';

// Base types without relations
export type PrismaUserBase = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profileImageURL: string | null;
  activeHouseholdId: string | null;
};

export type PrismaMessageBase = Prisma.MessageGetPayload<{}>;
export type PrismaThreadBase = Prisma.ThreadGetPayload<{}>;
export type PrismaHouseholdBase = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  currency: string;
  icon: string | null;
  timezone: string;
  language: string;
};
export type PrismaChoreBase = Prisma.ChoreGetPayload<{}>;
export type PrismaExpenseBase = Prisma.ExpenseGetPayload<{}>;
export type PrismaEventBase = Prisma.EventGetPayload<{}>;
export type PrismaNotificationBase = Prisma.NotificationGetPayload<{}>;
export type PrismaTransactionBase = Prisma.TransactionGetPayload<{}>;
export type PrismaSubtaskBase = Prisma.SubtaskGetPayload<{}>;
export type PrismaPollBase = Prisma.PollGetPayload<{}>;
export type PrismaPollOptionBase = Prisma.PollOptionGetPayload<{}>;
export type PrismaPollVoteBase = Prisma.PollVoteGetPayload<{}>;

// User related types
export type PrismaUserWithFullRelations = PrismaUserBase & {
  activeHousehold?: Prisma.HouseholdGetPayload<{}> | null;
  households?: Prisma.HouseholdMemberGetPayload<{}>[];
  messages: Prisma.MessageGetPayload<{}>[];
  threads: Prisma.ThreadGetPayload<{}>[];
  assignedChores: Prisma.ChoreGetPayload<{}>[];
  expensesPaid: Prisma.ExpenseGetPayload<{}>[];
  expenseSplits: Prisma.ExpenseSplitGetPayload<{}>[];
  transactionsFrom: Prisma.TransactionGetPayload<{}>[];
  transactionsTo: Prisma.TransactionGetPayload<{}>[];
  notifications: Prisma.NotificationGetPayload<{}>[];
  oauthIntegrations: Prisma.OAuthIntegrationGetPayload<{}>[];
  eventsCreated: Prisma.EventGetPayload<{}>[];
  choreSwapRequestsInitiated: Prisma.ChoreSwapRequestGetPayload<{}>[];
  choreSwapRequestsReceived: Prisma.ChoreSwapRequestGetPayload<{}>[];
  reactions: Prisma.ReactionGetPayload<{}>[];
  mentions: Prisma.MentionGetPayload<{}>[];
  choreHistory: Prisma.ChoreHistoryGetPayload<{}>[];
  notificationSettings: Prisma.NotificationSettingsGetPayload<{}>[];
  calendarEventHistory: Prisma.EventGetPayload<{}>[];
  expenseHistory: Prisma.ExpenseHistoryGetPayload<{}>[];
  messageReads: Prisma.MessageReadGetPayload<{}>[];
  refreshTokens: Prisma.RefreshTokenGetPayload<{}>[];
};

// Define the select type for minimal user
export const userMinimalSelect = {
  id: true,
  email: true,
  name: true,
  profileImageURL: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  activeHouseholdId: true,
} as const;

// Define the type using the select
export type PrismaUserMinimal = PrismaUserBase;

// Household related types
export type PrismaHouseholdWithFullRelations = PrismaHouseholdBase & {
  members: PrismaMemberInput[];
  threads: Prisma.ThreadGetPayload<{}>[];
  chores: Prisma.ChoreGetPayload<{}>[];
  expenses: Prisma.ExpenseGetPayload<{}>[];
  events: Prisma.EventGetPayload<{}>[];
  choreTemplates: Prisma.ChoreTemplateGetPayload<{}>[];
  notificationSettings: Prisma.NotificationSettingsGetPayload<{}>[];
};

export type PrismaHouseholdMinimal = Prisma.HouseholdGetPayload<{
  select: {
    id: true;
    name: true;
  };
}>;

// Chore related types
export type PrismaChoreWithFullRelations = Prisma.ChoreGetPayload<{
  include: {
    household: true;
    event: true;
    recurrenceRule: true;
    subtasks: true;
    assignments: {
      include: {
        user: true;
      };
    };
    history: {
      include: {
        user: true;
      };
    };
    choreSwapRequests: {
      include: {
        requestingUser: true;
        targetUser: true;
      };
    };
  };
}>;

// Expense related types
export type PrismaExpenseWithFullRelations = Prisma.ExpenseGetPayload<{
  include: {
    household: true;
    paidBy: true;
    splits: {
      include: {
        user: true;
      };
    };
    transactions: {
      include: {
        fromUser: true;
        toUser: true;
      };
    };
    receipts: true;
    history: {
      include: {
        user: true;
      };
    };
  };
}>;

export type PrismaExpenseSplitWithRelations = Prisma.ExpenseSplitGetPayload<{
  include: {
    user: {
      select: typeof userMinimalSelect;
    };
  };
}>;

export type PrismaTransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    expense: true;
    fromUser: true;
    toUser: true;
  };
}>;

// Event related types
export type PrismaEventWithFullRelations = Prisma.EventGetPayload<{
  include: {
    reminders: true;
    household: true;
    createdBy: true;
    chore: {
      include: {
        household: true;
        event: true;
        recurrenceRule: true;
        subtasks: {
          select: {
            id: true;
            choreId: true;
            title: true;
            description: true;
            status: true;
          };
        };
        assignments: {
          include: {
            user: true;
          };
        };
        history: {
          include: {
            user: true;
          };
        };
        swapRequests: {
          include: {
            requestingUser: true;
            targetUser: true;
          };
        };
      };
    };
    recurrenceRule: true;
    history: {
      include: {
        user: true;
      };
    };
    poll: {
      include: {
        message: {
          include: {
            thread: true;
          };
        };
        event: true;
        options: {
          include: {
            votes: {
              include: {
                user: {
                  select: typeof userMinimalSelect;
                };
              };
            };
            selectedForPolls: true;
          };
        };
        selectedOption: {
          include: {
            votes: {
              include: {
                user: {
                  select: typeof userMinimalSelect;
                };
              };
            };
            selectedForPolls: true;
          };
        };
      };
    };
  };
}>;

export type PrismaEventMinimal = Prisma.EventGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    startTime: true;
    endTime: true;
    category: true;
    status: true;
  };
}>;

export type PrismaEventReminderWithRelations = Prisma.EventReminderGetPayload<{
  select: {
    id: true;
    eventId: true;
    time: true;
    type: true;
  };
}>;

export type PrismaEventUpdateInput = Prisma.EventUpdateInput;

// Notification related types
export type PrismaNotificationWithFullRelations =
  Prisma.NotificationGetPayload<{
    include: {
      user: true;
    };
  }>;

export type PrismaNotificationSettingsWithFullRelations =
  Prisma.NotificationSettingsGetPayload<{
    include: {
      user: true;
      household: true;
    };
  }>;

// Utility types for flexible composition
export type WithCustomUser<T, U = PrismaUserMinimal> = Omit<T, 'user'> & {
  user: U;
};

export type WithCustomUsers<T, U = PrismaUserMinimal> = Omit<T, 'users'> & {
  users: U[];
};

export type WithCustomEvent<T, U = PrismaEventMinimal> = Omit<T, 'event'> & {
  event: U;
};

export type WithCustomParticipants<T, U = PrismaUserMinimal> = Omit<
  T,
  'participants'
> & {
  participants: {
    user: U;
  }[];
};

// Other related types
export type PrismaRecurrenceRule = Prisma.RecurrenceRuleGetPayload<{
  include: {
    chores: true;
    events: true;
  };
}>;

export type PrismaOAuthIntegration = Prisma.OAuthIntegrationGetPayload<{
  include: {
    user: true;
  };
}>;

export type PrismaOAuthIntegrationWithFullRelations =
  Prisma.OAuthIntegrationGetPayload<{
    include: {
      user: true;
    };
  }>;

// Template related types
export type PrismaChoreTemplateWithFullRelations =
  Prisma.ChoreTemplateGetPayload<{
    include: {
      household: true;
      subtasks: true;
      chores: true;
    };
  }>;

export type PrismaSubtaskWithFullRelations = Prisma.SubtaskGetPayload<{
  include: {
    chore: true;
  };
}>;

export type PrismaThreadWithFullRelations = Prisma.ThreadGetPayload<{
  include: {
    messages: {
      include: {
        thread: true;
        author: {
          select: typeof userMinimalSelect;
        };
        attachments: {
          include: {
            message: {
              select: {
                id: true;
                threadId: true;
              };
            };
          };
        };
        reactions: {
          include: {
            user: {
              select: typeof userMinimalSelect;
            };
            message: {
              include: {
                thread: true;
              };
            };
          };
        };
        mentions: {
          include: {
            user: {
              select: typeof userMinimalSelect;
            };
            message: {
              include: {
                thread: true;
              };
            };
          };
        };
        reads: {
          include: {
            user: {
              select: typeof userMinimalSelect;
            };
            message: {
              include: {
                thread: true;
              };
            };
          };
        };
        poll: {
          include: {
            event: true;
            options: {
              include: {
                votes: {
                  include: {
                    user: {
                      select: typeof userMinimalSelect;
                    };
                  };
                };
                selectedForPolls: true;
              };
            };
            selectedOption: {
              include: {
                votes: {
                  include: {
                    user: {
                      select: typeof userMinimalSelect;
                    };
                  };
                };
                selectedForPolls: true;
              };
            };
          };
        };
      };
    };
    author: {
      select: typeof userMinimalSelect;
    };
    household: true;
    participants: {
      include: {
        user: true;
      };
    };
  };
}>;

export type PrismaMessageWithFullRelations = Prisma.MessageGetPayload<{
  include: {
    thread: true;
    author: {
      select: typeof userMinimalSelect;
    };
    attachments: {
      include: {
        message: {
          select: {
            id: true;
            threadId: true;
          };
        };
      };
    };
    reactions: {
      include: {
        user: {
          select: typeof userMinimalSelect;
        };
        message: {
          include: {
            thread: true;
          };
        };
      };
    };
    mentions: {
      include: {
        user: {
          select: typeof userMinimalSelect;
        };
        message: {
          include: {
            thread: true;
          };
        };
      };
    };
    reads: {
      include: {
        user: {
          select: typeof userMinimalSelect;
        };
        message: {
          include: {
            thread: true;
          };
        };
      };
    };
    poll: {
      include: {
        event: true;
        options: {
          include: {
            votes: {
              include: {
                user: {
                  select: typeof userMinimalSelect;
                };
              };
            };
            selectedForPolls: true;
          };
        };
        selectedOption: {
          include: {
            votes: {
              include: {
                user: {
                  select: typeof userMinimalSelect;
                };
              };
            };
            selectedForPolls: true;
          };
        };
      };
    };
  };
}>;

export type PrismaMessageMinimal = Prisma.MessageGetPayload<{
  select: {
    id: true;
    threadId: true;
    authorId: true;
    content: true;
    createdAt: true;
    updatedAt: true;
    deletedAt: true;
  };
}>;

export type WithCustomHousehold<T, U = PrismaHouseholdMinimal> = Omit<
  T,
  'household'
> & {
  household: U;
};

export type WithCustomMessage<T, U = PrismaMessageMinimal> = Omit<
  T,
  'message'
> & {
  message: U;
};

export type PrismaSubtaskMinimal = Prisma.SubtaskGetPayload<{
  select: {
    id: true;
    choreId: true;
    title: true;
    description: true;
    status: true;
  };
}>;

export type PrismaTransactionWithFullRelations = Prisma.TransactionGetPayload<{
  include: {
    expense: true;
    fromUser: true;
    toUser: true;
  };
}>;

export type PrismaReceiptWithFullRelations = Prisma.ReceiptGetPayload<{
  include: {
    expense: true;
  };
}>;

export type PrismaExpenseHistoryWithFullRelations =
  Prisma.ExpenseHistoryGetPayload<{
    include: {
      expense: true;
      user: true;
    };
  }>;

export type PrismaChoreHistoryWithFullRelations =
  Prisma.ChoreHistoryGetPayload<{
    include: {
      chore: true;
      user: true;
    };
  }>;

export type PrismaRecurrenceRuleWithFullRelations =
  Prisma.RecurrenceRuleGetPayload<{
    select: {
      id: true;
      frequency: true;
      interval: true;
      byWeekDay: true;
      byMonthDay: true;
      bySetPos: true;
      count: true;
      until: true;
      customRuleString: true;
    };
  }>;

export type PrismaChoreTemplateWithRelations = Prisma.ChoreTemplateGetPayload<{
  include: {
    household: true;
    subtasks: true;
  };
}>;

export type PrismaChoreAssignmentWithRelations =
  Prisma.ChoreAssignmentGetPayload<{
    include: {
      chore: true;
      user: true;
    };
  }>;

export type PrismaThreadWithParticipants = Prisma.ThreadGetPayload<{
  include: {
    participants: {
      include: {
        user: true;
      };
    };
  };
}>;

export type PrismaChoreSwapRequestWithRelations =
  Prisma.ChoreSwapRequestGetPayload<{
    include: {
      chore: true;
      requestingUser: true;
      targetUser: true;
    };
  }>;

export type PrismaAttachmentWithFullRelations = Prisma.AttachmentGetPayload<{
  include: {
    message: {
      select: {
        id: true;
        threadId: true;
      };
    };
  };
}>;

export type PrismaReactionWithFullRelations = Prisma.ReactionGetPayload<{
  include: {
    user: {
      select: typeof userMinimalSelect;
    };
    message: {
      include: {
        thread: {
          select: {
            id: true;
            householdId: true;
            authorId: true;
            title: true;
            createdAt: true;
            updatedAt: true;
            deletedAt: true;
          };
        };
      };
    };
  };
}>;

export type PrismaMentionWithFullRelations = Prisma.MentionGetPayload<{
  include: {
    user: {
      select: typeof userMinimalSelect;
    };
    message: {
      include: {
        thread: {
          select: {
            id: true;
            householdId: true;
            authorId: true;
            title: true;
            createdAt: true;
            updatedAt: true;
            deletedAt: true;
          };
        };
      };
    };
  };
}>;

export type PrismaMessageReadWithFullRelations = Prisma.MessageReadGetPayload<{
  include: {
    user: {
      select: typeof userMinimalSelect;
    };
    message: {
      include: {
        thread: {
          select: {
            id: true;
            householdId: true;
            authorId: true;
            title: true;
            createdAt: true;
            updatedAt: true;
            deletedAt: true;
          };
        };
      };
    };
  };
}>;

export type PrismaThreadWithMessagesAndParticipants = Prisma.ThreadGetPayload<{
  include: {
    messages: {
      include: {
        thread: true;
        author: true;
        attachments: {
          include: {
            message: true;
          };
        };
        reactions: {
          include: {
            user: true;
            message: true;
          };
        };
        mentions: {
          include: {
            user: true;
            message: true;
          };
        };
        reads: {
          include: {
            user: true;
            message: true;
          };
        };
        poll: {
          include: {
            message: {
              include: {
                thread: true;
              };
            };
            event: true;
            options: {
              include: {
                votes: {
                  include: {
                    user: {
                      select: typeof userMinimalSelect;
                    };
                  };
                };
                selectedForPolls: true;
              };
            };
            selectedOption: {
              include: {
                votes: {
                  include: {
                    user: {
                      select: typeof userMinimalSelect;
                    };
                  };
                };
                selectedForPolls: true;
              };
            };
          };
        };
      };
    };
    participants: {
      include: {
        user: true;
      };
    };
  };
}>;

export type PrismaThreadWithParticipantsOnly = Prisma.ThreadGetPayload<{
  include: {
    participants: {
      include: {
        user: true;
      };
    };
  };
}>;

// Add new type for reaction analytics
export type PrismaReactionAnalytics = {
  type: string;
  _count: {
    type: number;
  };
}[];

// Add new poll-related Prisma types
export type PrismaPollOptionWithFullRelations = Prisma.PollOptionGetPayload<{
  include: {
    poll: true;
    votes: {
      include: {
        user: {
          select: typeof userMinimalSelect;
        };
      };
    };
    selectedForPolls: true;
  };
}>;

export type PrismaPollVoteWithFullRelations = Prisma.PollVoteGetPayload<{
  include: {
    option: {
      include: {
        poll: true;
        votes: {
          include: {
            user: {
              select: typeof userMinimalSelect;
            };
          };
        };
        selectedForPolls: true;
      };
    };
    user: {
      select: typeof userMinimalSelect;
    };
  };
}>;

// Add this type for the event in poll relations
export type PrismaEventInPollRelations = Prisma.EventGetPayload<{
  select: {
    id: true;
    householdId: true;
    title: true;
    description: true;
    startTime: true;
    endTime: true;
    createdById: true;
    createdAt: true;
    updatedAt: true;
    choreId: true;
    recurrenceRuleId: true;
    category: true;
    isAllDay: true;
    location: true;
    isPrivate: true;
    status: true;
    deletedAt: true;
  };
}>;

// Update PrismaPollWithFullRelations to use the new type
export type PrismaPollWithFullRelations = Prisma.PollGetPayload<{
  include: {
    message: {
      include: {
        thread: true;
      };
    };
    event: true; // This will use PrismaEventInPollRelations
    options: {
      include: {
        votes: {
          include: {
            user: {
              select: typeof userMinimalSelect;
            };
          };
        };
        selectedForPolls: true;
      };
    };
    selectedOption: {
      include: {
        votes: {
          include: {
            user: {
              select: typeof userMinimalSelect;
            };
          };
        };
        selectedForPolls: true;
      };
    };
  };
}>;

// Member related types
export type PrismaMemberInput = {
  id: string;
  userId: string;
  householdId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
  isInvited: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  nickname: string | null;
  user?: {
    id: string;
    email: string;
    name: string;
    profileImageURL: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    activeHouseholdId: string | null;
  };
};
