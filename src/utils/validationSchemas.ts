import Joi from 'joi';
import {
  HouseholdRole,
  NotificationType,
  TransactionStatus,
} from '@shared/enums';

/**
 * Schema for creating a new chore.
 */
export const createChoreSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  priority: Joi.number().integer().min(1).max(5).optional(),
  recurrence: Joi.string().optional(),
  assignedUserIds: Joi.array().items(Joi.string().uuid()).optional(),
  subtasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
      })
    )
    .optional(),
});

/**
 * Schema for creating a new message.
 */
export const createMessageSchema = Joi.object({
  content: Joi.string().required(),
  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        fileType: Joi.string().required(),
      })
    )
    .optional(),
});

/**
 * Schema for updating an existing message.
 */
export const updateMessageSchema = Joi.object({
  content: Joi.string().optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        fileType: Joi.string().required(),
      })
    )
    .optional(),
});

/**
 * Schema for creating a new thread.
 */
export const createThreadSchema = Joi.object({
  content: Joi.string().required(),
});

/**
 * Schema for creating a new attachment.
 */
export const createAttachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  fileType: Joi.string().required(),
});

export const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Schema for updating an existing chore.
 */
export const updateChoreSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  priority: Joi.number().integer().min(1).max(5).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
  recurrence: Joi.string().optional(),
  assignedUserIds: Joi.array().items(Joi.string().uuid()).optional(),
  subtasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().optional(),
        status: Joi.string().valid('PENDING', 'COMPLETED').optional(),
      })
    )
    .optional(),
});

/**
 * Schema for creating a new subtask.
 */
export const createSubtaskSchema = Joi.object({
  title: Joi.string().required(),
});

/**
 * Schema for updating a subtask's status.
 */
export const updateSubtaskStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'COMPLETED').required(),
});

/**
 * Validation schema for creating a new expense.
 */
export const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': '\'amount\' should be a type of \'number\'',
    'number.positive': '\'amount\' must be a positive number',
    'any.required': '\'amount\' is a required field',
  }),
  description: Joi.string().required().messages({
    'string.base': '\'description\' should be a type of \'text\'',
    'any.required': '\'description\' is a required field',
  }),
  paidById: Joi.string().uuid().required().messages({
    'string.base': '\'paidById\' should be a type of \'string\'',
    'string.uuid': '\'paidById\' must be a valid UUID',
    'any.required': '\'paidById\' is a required field',
  }),
  dueDate: Joi.date().optional().messages({
    'date.base': '\'dueDate\' should be a valid date',
  }),
  category: Joi.string().optional().messages({
    'string.base': '\'category\' should be a type of \'string\'',
  }),
  splits: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().uuid().required().messages({
          'string.base': '\'userId\' should be a type of \'string\'',
          'string.uuid': '\'userId\' must be a valid UUID',
          'any.required': '\'userId\' is a required field',
        }),
        amount: Joi.number().positive().required().messages({
          'number.base': '\'amount\' should be a type of \'number\'',
          'number.positive': '\'amount\' must be a positive number',
          'any.required': '\'amount\' is a required field',
        }),
      })
    )
    .optional()
    .messages({
      'array.base': '\'splits\' should be a type of \'array\'',
    }),
});

/**
 * Validation schema for updating an existing expense.
 */
export const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive().messages({
    'number.base': '\'amount\' should be a type of \'number\'',
    'number.positive': '\'amount\' must be a positive number',
  }),
  description: Joi.string().messages({
    'string.base': '\'description\' should be a type of \'text\'',
  }),
  dueDate: Joi.date().messages({
    'date.base': '\'dueDate\' should be a valid date',
  }),
  category: Joi.string().messages({
    'string.base': '\'category\' should be a type of \'string\'',
  }),
  splits: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().uuid().required().messages({
          'string.base': '\'userId\' should be a type of \'string\'',
          'string.uuid': '\'userId\' must be a valid UUID',
          'any.required': '\'userId\' is a required field',
        }),
        amount: Joi.number().positive().required().messages({
          'number.base': '\'amount\' should be a type of \'number\'',
          'number.positive': '\'amount\' must be a positive number',
          'any.required': '\'amount\' is a required field',
        }),
      })
    )
    .optional()
    .messages({
      'array.base': '\'splits\' should be a type of \'array\'',
    }),
});

// Calendar Integration Schemas

/**
 * Schema for creating a new calendar event.
 */
export const createEventSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  choreId: Joi.string().uuid().optional(),
});

/**
 * Schema for updating an existing calendar event.
 */
export const updateEventSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().optional(),
  choreId: Joi.string().uuid().allow(null).optional(),
});

/**
 * Schema for syncing with a personal calendar.
 */
export const syncCalendarSchema = Joi.object({
  provider: Joi.string().valid('GOOGLE').required(),
  accessToken: Joi.string().required(),
});

/**
 * Validation schema for creating a new household.
 */
export const createHouseholdSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.base': '\'name\' should be a type of \'text\'',
    'string.min': '\'name\' should have a minimum length of {#limit}',
    'string.max': '\'name\' should have a maximum length of {#limit}',
    'any.required': '\'name\' is a required field',
  }),
  currency: Joi.string().required(),
  timezone: Joi.string().required(),
  language: Joi.string().required(),
});

/**
 * Validation schema for updating an existing household.
 */
export const updateHouseholdSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    'string.base': '\'name\' should be a type of \'text\'',
    'string.min': '\'name\' should have a minimum length of {#limit}',
    'string.max': '\'name\' should have a maximum length of {#limit}',
  }),
  currency: Joi.string().optional(),
  timezone: Joi.string().optional(),
  language: Joi.string().optional(),
});

/**
 * Validation schema for adding a new member to a household.
 */
export const addMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('ADMIN', 'MEMBER').optional(),
});

/**
 * Schema for creating a new notification.
 */
export const createNotificationSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.base': '\'userId\' should be a type of \'string\'',
    'string.uuid': '\'userId\' must be a valid UUID',
    'any.required': '\'userId\' is a required field',
  }),
  type: Joi.string()
    .valid(...Object.values(NotificationType))
    .required()
    .messages({
      'any.only': `'type' must be one of ${Object.values(NotificationType).join(
        ', '
      )}`,
      'any.required': '\'type\' is a required field',
    }),
  message: Joi.string().required().messages({
    'string.base': '\'message\' should be a type of \'string\'',
    'any.required': '\'message\' is a required field',
  }),
  isRead: Joi.boolean().optional().messages({
    'boolean.base': '\'isRead\' should be a type of \'boolean\'',
  }),
});

/**
 * Schema for marking a notification as read.
 */
export const markAsReadSchema = Joi.object({
  // No body is expected, assuming it's a PATCH to /read endpoint
}).unknown(true); // Allow other properties like params

/**
 * Schema for creating a new transaction.
 */
export const createTransactionSchema = Joi.object({
  expenseId: Joi.string().uuid().required().messages({
    'string.base': '\'expenseId\' should be a type of \'string\'',
    'string.uuid': '\'expenseId\' must be a valid UUID',
    'any.required': '\'expenseId\' is a required field',
  }),
  fromUserId: Joi.string().uuid().required().messages({
    'string.base': '\'fromUserId\' should be a type of \'string\'',
    'string.uuid': '\'fromUserId\' must be a valid UUID',
    'any.required': '\'fromUserId\' is a required field',
  }),
  toUserId: Joi.string().uuid().required().messages({
    'string.base': '\'toUserId\' should be a type of \'string\'',
    'string.uuid': '\'toUserId\' must be a valid UUID',
    'any.required': '\'toUserId\' is a required field',
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': '\'amount\' should be a type of \'number\'',
    'number.positive': '\'amount\' must be a positive number',
    'any.required': '\'amount\' is a required field',
  }),
  status: Joi.string()
    .valid(...Object.values(TransactionStatus))
    .optional()
    .messages({
      'any.only': `'status' must be one of ${Object.values(
        TransactionStatus
      ).join(', ')}`,
    }),
});

/**
 * Schema for updating a transaction's status.
 */
export const updateTransactionStatusSchema = Joi.object({
  status: Joi.string()
    .valid(TransactionStatus.COMPLETED, TransactionStatus.PENDING)
    .required()
    .messages({
      'any.only': `'status' must be one of ${Object.values(
        TransactionStatus
      ).join(', ')}`,
      'any.required': '\'status\' is a required field',
    }),
});

export const updateMemberRoleSchema = {
  role: Joi.string().valid('ADMIN', 'MEMBER').required(),
};

export const updateMemberStatusSchema = {
  accept: Joi.boolean().required(),
};

export const updateMemberSelectionSchema = {
  isSelected: Joi.boolean().required(),
};

/**
 * Schema for validating email format.
 */
export const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': '\'email\' should be a type of \'text\'',
    'string.email': '\'email\' must be a valid email address',
    'string.empty': '\'email\' cannot be empty',
    'any.required': '\'email\' is a required field',
  }),
});
