"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecurrenceRuleSchema = exports.emailSchema = exports.updateMemberSelectionSchema = exports.updateMemberStatusSchema = exports.updateMemberRoleSchema = exports.updateTransactionStatusSchema = exports.createTransactionSchema = exports.markAsReadSchema = exports.createNotificationSchema = exports.addMemberSchema = exports.updateHouseholdSchema = exports.createHouseholdSchema = exports.syncCalendarSchema = exports.updateEventSchema = exports.createEventSchema = exports.updateExpenseSchema = exports.createExpenseSchema = exports.updateSubtaskStatusSchema = exports.createSubtaskSchema = exports.updateChoreSchema = exports.loginUserSchema = exports.registerUserSchema = exports.createAttachmentSchema = exports.createThreadSchema = exports.updateMessageSchema = exports.createMessageSchema = exports.createChoreSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
/**
 * Schema for creating a new chore.
 */
exports.createChoreSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    dueDate: joi_1.default.date().optional(),
    priority: joi_1.default.number().integer().min(1).max(5).optional(),
    recurrence: joi_1.default.string().optional(),
    assignedUserIds: joi_1.default.array().items(joi_1.default.string().uuid()).optional(),
    subtasks: joi_1.default.array()
        .items(joi_1.default.object({
        title: joi_1.default.string().required(),
    }))
        .optional(),
});
/**
 * Schema for creating a new message.
 */
exports.createMessageSchema = joi_1.default.object({
    content: joi_1.default.string().required().messages({
        "string.base": "'content' should be a type of 'text'",
        "string.empty": "'content' cannot be empty",
        "any.required": "'content' is a required field",
    }),
    threadId: joi_1.default.string().uuid().required().messages({
        "string.base": "'threadId' should be a type of 'string'",
        "string.uuid": "'threadId' must be a valid UUID",
        "any.required": "'threadId' is a required field",
    }),
    mentions: joi_1.default.array().items(joi_1.default.string().uuid()).optional().messages({
        "array.base": "'mentions' should be a type of 'array'",
        "string.uuid": "Each mention ID must be a valid UUID",
    }),
    attachments: joi_1.default.array()
        .items(joi_1.default.object({
        url: joi_1.default.string().uri().required(),
        fileType: joi_1.default.string().required(),
    }))
        .optional()
        .messages({
        "array.base": "'attachments' should be a type of 'array'",
    }),
    poll: joi_1.default.object({
        question: joi_1.default.string().required(),
        pollType: joi_1.default.string().required(),
        maxChoices: joi_1.default.number().integer().min(1).optional(),
        maxRank: joi_1.default.number().integer().min(1).optional(),
        endDate: joi_1.default.date().iso().optional(),
        eventId: joi_1.default.string().uuid().optional(),
        options: joi_1.default.array()
            .items(joi_1.default.object({
            text: joi_1.default.string().required(),
            order: joi_1.default.number().integer().min(0).required(),
            startTime: joi_1.default.date().iso().optional(),
            endTime: joi_1.default.date().iso().optional(),
        }))
            .min(1)
            .required(),
    }).optional(),
});
/**
 * Schema for updating an existing message.
 */
exports.updateMessageSchema = joi_1.default.object({
    content: joi_1.default.string().optional(),
    attachments: joi_1.default.array()
        .items(joi_1.default.object({
        url: joi_1.default.string().uri().required(),
        fileType: joi_1.default.string().required(),
    }))
        .optional(),
});
/**
 * Schema for creating a new thread.
 */
exports.createThreadSchema = joi_1.default.object({
    householdId: joi_1.default.string().uuid().required().messages({
        "string.base": "'householdId' should be a type of 'string'",
        "string.uuid": "'householdId' must be a valid UUID",
        "any.required": "'householdId' is a required field",
    }),
    title: joi_1.default.string().optional().messages({
        "string.base": "'title' should be a type of 'text'",
    }),
    participants: joi_1.default.array().items(joi_1.default.string().uuid()).required().messages({
        "array.base": "'participants' should be a type of 'array'",
        "string.uuid": "Each participant ID must be a valid UUID",
        "any.required": "'participants' is a required field",
    }),
    initialMessage: joi_1.default.object({
        content: joi_1.default.string().required().messages({
            "string.base": "'content' should be a type of 'text'",
            "any.required": "'content' is a required field",
        }),
        attachments: joi_1.default.array()
            .items(joi_1.default.object({
            url: joi_1.default.string().uri().required(),
            fileType: joi_1.default.string().required(),
        }))
            .optional(),
        mentions: joi_1.default.array().items(joi_1.default.string().uuid()).optional(),
    }).optional(),
});
/**
 * Schema for creating a new attachment.
 */
exports.createAttachmentSchema = joi_1.default.object({
    url: joi_1.default.string().uri().required(),
    fileType: joi_1.default.string().required(),
});
exports.registerUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    name: joi_1.default.string().min(2).required(),
});
exports.loginUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
/**
 * Schema for updating an existing chore.
 */
exports.updateChoreSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    dueDate: joi_1.default.date().optional(),
    priority: joi_1.default.number().integer().min(1).max(5).optional(),
    status: joi_1.default.string().valid("PENDING", "IN_PROGRESS", "COMPLETED").optional(),
    recurrence: joi_1.default.string().optional(),
    assignedUserIds: joi_1.default.array().items(joi_1.default.string().uuid()).optional(),
    subtasks: joi_1.default.array()
        .items(joi_1.default.object({
        title: joi_1.default.string().optional(),
        status: joi_1.default.string().valid("PENDING", "COMPLETED").optional(),
    }))
        .optional(),
});
/**
 * Schema for creating a new subtask.
 */
exports.createSubtaskSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
});
/**
 * Schema for updating a subtask's status.
 */
exports.updateSubtaskStatusSchema = joi_1.default.object({
    status: joi_1.default.string().valid("PENDING", "COMPLETED").required(),
});
/**
 * Validation schema for creating a new expense.
 */
exports.createExpenseSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().required().messages({
        "number.base": "'amount' should be a type of 'number'",
        "number.positive": "'amount' must be a positive number",
        "any.required": "'amount' is a required field",
    }),
    description: joi_1.default.string().required().messages({
        "string.base": "'description' should be a type of 'text'",
        "any.required": "'description' is a required field",
    }),
    paidById: joi_1.default.string().uuid().required().messages({
        "string.base": "'paidById' should be a type of 'string'",
        "string.uuid": "'paidById' must be a valid UUID",
        "any.required": "'paidById' is a required field",
    }),
    dueDate: joi_1.default.date().optional().messages({
        "date.base": "'dueDate' should be a valid date",
    }),
    category: joi_1.default.string().optional().messages({
        "string.base": "'category' should be a type of 'string'",
    }),
    splits: joi_1.default.array()
        .items(joi_1.default.object({
        userId: joi_1.default.string().uuid().required().messages({
            "string.base": "'userId' should be a type of 'string'",
            "string.uuid": "'userId' must be a valid UUID",
            "any.required": "'userId' is a required field",
        }),
        amount: joi_1.default.number().positive().required().messages({
            "number.base": "'amount' should be a type of 'number'",
            "number.positive": "'amount' must be a positive number",
            "any.required": "'amount' is a required field",
        }),
    }))
        .optional()
        .messages({
        "array.base": "'splits' should be a type of 'array'",
    }),
});
/**
 * Validation schema for updating an existing expense.
 */
exports.updateExpenseSchema = joi_1.default.object({
    amount: joi_1.default.number().positive().messages({
        "number.base": "'amount' should be a type of 'number'",
        "number.positive": "'amount' must be a positive number",
    }),
    description: joi_1.default.string().messages({
        "string.base": "'description' should be a type of 'text'",
    }),
    dueDate: joi_1.default.date().messages({
        "date.base": "'dueDate' should be a valid date",
    }),
    category: joi_1.default.string().messages({
        "string.base": "'category' should be a type of 'string'",
    }),
    splits: joi_1.default.array()
        .items(joi_1.default.object({
        userId: joi_1.default.string().uuid().required().messages({
            "string.base": "'userId' should be a type of 'string'",
            "string.uuid": "'userId' must be a valid UUID",
            "any.required": "'userId' is a required field",
        }),
        amount: joi_1.default.number().positive().required().messages({
            "number.base": "'amount' should be a type of 'number'",
            "number.positive": "'amount' must be a positive number",
            "any.required": "'amount' is a required field",
        }),
    }))
        .optional()
        .messages({
        "array.base": "'splits' should be a type of 'array'",
    }),
});
// Calendar Integration Schemas
/**
 * Schema for creating a new calendar event.
 */
exports.createEventSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    startTime: joi_1.default.date().iso().required(),
    endTime: joi_1.default.date().iso().greater(joi_1.default.ref("startTime")).required(),
    choreId: joi_1.default.string().uuid().optional(),
});
/**
 * Schema for updating an existing calendar event.
 */
exports.updateEventSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    startTime: joi_1.default.date().iso().optional(),
    endTime: joi_1.default.date().iso().optional(),
    choreId: joi_1.default.string().uuid().allow(null).optional(),
});
/**
 * Schema for syncing with a personal calendar.
 */
exports.syncCalendarSchema = joi_1.default.object({
    provider: joi_1.default.string().valid("GOOGLE").required(),
    accessToken: joi_1.default.string().required(),
});
/**
 * Validation schema for creating a new household.
 */
exports.createHouseholdSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100).required().messages({
        "string.base": "'name' should be a type of 'text'",
        "string.min": "'name' should have a minimum length of {#limit}",
        "string.max": "'name' should have a maximum length of {#limit}",
        "any.required": "'name' is a required field",
    }),
    currency: joi_1.default.string().required(),
    timezone: joi_1.default.string().required(),
    language: joi_1.default.string().required(),
});
/**
 * Validation schema for updating an existing household.
 */
exports.updateHouseholdSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100).optional().messages({
        "string.base": "'name' should be a type of 'text'",
        "string.min": "'name' should have a minimum length of {#limit}",
        "string.max": "'name' should have a maximum length of {#limit}",
    }),
    currency: joi_1.default.string().optional(),
    timezone: joi_1.default.string().optional(),
    language: joi_1.default.string().optional(),
});
/**
 * Validation schema for adding a new member to a household.
 */
exports.addMemberSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    role: joi_1.default.string().valid("ADMIN", "MEMBER").optional(),
});
/**
 * Schema for creating a new notification.
 */
exports.createNotificationSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required().messages({
        "string.base": "'userId' should be a type of 'string'",
        "string.uuid": "'userId' must be a valid UUID",
        "any.required": "'userId' is a required field",
    }),
    type: joi_1.default.string()
        .valid(...Object.values(enums_1.NotificationType))
        .required()
        .messages({
        "any.only": `'type' must be one of ${Object.values(enums_1.NotificationType).join(", ")}`,
        "any.required": "'type' is a required field",
    }),
    message: joi_1.default.string().required().messages({
        "string.base": "'message' should be a type of 'string'",
        "any.required": "'message' is a required field",
    }),
    isRead: joi_1.default.boolean().optional().messages({
        "boolean.base": "'isRead' should be a type of 'boolean'",
    }),
});
/**
 * Schema for marking a notification as read.
 */
exports.markAsReadSchema = joi_1.default.object({
// No body is expected, assuming it's a PATCH to /read endpoint
}).unknown(true); // Allow other properties like params
/**
 * Schema for creating a new transaction.
 */
exports.createTransactionSchema = joi_1.default.object({
    expenseId: joi_1.default.string().uuid().required().messages({
        "string.base": "'expenseId' should be a type of 'string'",
        "string.uuid": "'expenseId' must be a valid UUID",
        "any.required": "'expenseId' is a required field",
    }),
    fromUserId: joi_1.default.string().uuid().required().messages({
        "string.base": "'fromUserId' should be a type of 'string'",
        "string.uuid": "'fromUserId' must be a valid UUID",
        "any.required": "'fromUserId' is a required field",
    }),
    toUserId: joi_1.default.string().uuid().required().messages({
        "string.base": "'toUserId' should be a type of 'string'",
        "string.uuid": "'toUserId' must be a valid UUID",
        "any.required": "'toUserId' is a required field",
    }),
    amount: joi_1.default.number().positive().required().messages({
        "number.base": "'amount' should be a type of 'number'",
        "number.positive": "'amount' must be a positive number",
        "any.required": "'amount' is a required field",
    }),
    status: joi_1.default.string()
        .valid(...Object.values(enums_1.TransactionStatus))
        .optional()
        .messages({
        "any.only": `'status' must be one of ${Object.values(enums_1.TransactionStatus).join(", ")}`,
    }),
});
/**
 * Schema for updating a transaction's status.
 */
exports.updateTransactionStatusSchema = joi_1.default.object({
    status: joi_1.default.string()
        .valid(enums_1.TransactionStatus.COMPLETED, enums_1.TransactionStatus.PENDING)
        .required()
        .messages({
        "any.only": `'status' must be one of ${Object.values(enums_1.TransactionStatus).join(", ")}`,
        "any.required": "'status' is a required field",
    }),
});
exports.updateMemberRoleSchema = {
    role: joi_1.default.string().valid("ADMIN", "MEMBER").required(),
};
exports.updateMemberStatusSchema = {
    accept: joi_1.default.boolean().required(),
};
exports.updateMemberSelectionSchema = {
    isSelected: joi_1.default.boolean().required(),
};
/**
 * Schema for validating email format.
 */
exports.emailSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        "string.base": "'email' should be a type of 'text'",
        "string.email": "'email' must be a valid email address",
        "string.empty": "'email' cannot be empty",
        "any.required": "'email' is a required field",
    }),
});
exports.createRecurrenceRuleSchema = joi_1.default.object({
    frequency: joi_1.default.string()
        .valid("DAILY", "WEEKLY", "MONTHLY", "YEARLY")
        .required(),
    interval: joi_1.default.number().min(1).required(),
    byWeekDay: joi_1.default.array()
        .items(joi_1.default.string().valid("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"))
        .optional(),
    byMonthDay: joi_1.default.array().items(joi_1.default.number().min(1).max(31)).optional(),
    bySetPos: joi_1.default.number().optional(),
    count: joi_1.default.number().min(1).optional(),
    until: joi_1.default.date().iso().optional(),
    customRuleString: joi_1.default.string().optional(),
});
