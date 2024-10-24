import { Prisma } from "@prisma/client";

// Base types without relations
export type PrismaUserBase = Prisma.UserGetPayload<{}>;
export type PrismaMessageBase = Prisma.MessageGetPayload<{}>;
export type PrismaThreadBase = Prisma.ThreadGetPayload<{}>;
export type PrismaHouseholdBase = Prisma.HouseholdGetPayload<{}>;
export type PrismaChoreBase = Prisma.ChoreGetPayload<{}>;
export type PrismaExpenseBase = Prisma.ExpenseGetPayload<{}>;
export type PrismaEventBase = Prisma.EventGetPayload<{}>;
export type PrismaNotificationBase = Prisma.NotificationGetPayload<{}>;
export type PrismaTransactionBase = Prisma.TransactionGetPayload<{}>;
export type PrismaSubtaskBase = Prisma.SubtaskGetPayload<{}>;

// User related types
export type PrismaUserWithFullRelations = Prisma.UserGetPayload<{
  include: {
    households: {
      include: {
        household: true;
      };
    };
    messages: true;
    threads: true;
    assignedChores: true;
    expensesPaid: true;
    expenseSplits: true;
    transactionsFrom: true;
    transactionsTo: true;
    notifications: true;
    oauthIntegrations: true;
    eventsCreated: true;
    choreSwapRequestsInitiated: true;
    choreSwapRequestsReceived: true;
    reactions: true;
    mentions: true;
    choreHistory: true;
    notificationSettings: true;
    calendarEventHistory: true;
    expenseHistory: true;
    messageReads: true;
    refreshTokens: true;
  };
}>;

export type PrismaUserMinimal = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    profileImageURL: true;
    createdAt: true;
    updatedAt: true;
    deletedAt: true;
  };
}>;

// Household related types
export type PrismaHouseholdWithFullRelations = Prisma.HouseholdGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
    threads: true;
    chores: true;
    expenses: true;
    events: true;
    choreTemplates: true;
    notificationSettings: true;
  };
}>;

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
    swapRequests: {
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
      select: {
        id: true;
        email: true;
        name: true;
        profileImageURL: true;
        createdAt: true;
        updatedAt: true;
        deletedAt: true;
      };
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
export type WithCustomUser<T, U = PrismaUserMinimal> = Omit<T, "user"> & {
  user: U;
};

export type WithCustomUsers<T, U = PrismaUserMinimal> = Omit<T, "users"> & {
  users: U[];
};

export type WithCustomEvent<T, U = PrismaEventMinimal> = Omit<T, "event"> & {
  event: U;
};

export type WithCustomParticipants<T, U = PrismaUserMinimal> = Omit<
  T,
  "participants"
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
      };
    };
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
  };
}>;

export type PrismaMessageMinimal = Prisma.MessageGetPayload<{
  select: {
    id: true;
    content: true;
    createdAt: true;
  };
}>;

export type WithCustomHousehold<T, U = PrismaHouseholdMinimal> = Omit<
  T,
  "household"
> & {
  household: U;
};

export type WithCustomMessage<T, U = PrismaMessageMinimal> = Omit<
  T,
  "message"
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
    include: {
      chores: true;
      events: true;
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
    message: true;
  };
}>;

export type PrismaReactionWithFullRelations = Prisma.ReactionGetPayload<{
  include: {
    message: true;
    user: true;
  };
}>;

export type PrismaMentionWithFullRelations = Prisma.MentionGetPayload<{
  include: {
    message: true;
    user: true;
  };
}>;

export type PrismaMessageReadWithFullRelations = Prisma.MessageReadGetPayload<{
  include: {
    message: true;
    user: true;
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
