"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityValidationRules = exports.auditLogSchema = exports.createOAuthIntegrationSchema = exports.attachmentSchema = exports.connectCalendarSchema = exports.calendarIntegrationSchema = exports.tagSchema = exports.updateEventSchema = exports.createEventSchema = exports.eventSchema = exports.createTransactionSchema = exports.updateExpenseSchema = exports.createExpenseSchema = exports.sharedFundTransactionSchema = exports.sharedFundSchema = exports.updateNotificationSchema = exports.createNotificationSchema = exports.notificationSchema = exports.replyMessageSchema = exports.createMessageSchema = exports.messageSchema = exports.updateSubtaskSchema = exports.createSubtaskSchema = exports.subtaskSchema = exports.updateChoreSchema = exports.createChoreSchema = exports.choreSchema = exports.householdInvitationSchema = exports.householdMemberSchema = exports.updateHouseholdSchema = exports.createHouseholdSchema = exports.householdSchema = exports.userPreferenceUpdateSchema = exports.userPreferenceSchema = exports.loginSchema = exports.registerSchema = exports.userSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// User Validation Schemas
exports.userSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().min(2).max(50).required(),
    profilePictureUrl: joi_1.default.string().uri().allow(null),
    bio: joi_1.default.string().max(500).allow(null),
});
exports.registerSchema = joi_1.default.object({
    username: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
exports.userPreferenceSchema = joi_1.default.object({
    choreAssignedNotif: joi_1.default.boolean(),
    choreCompletedNotif: joi_1.default.boolean(),
    choreDueSoonNotif: joi_1.default.boolean(),
    householdInviteNotif: joi_1.default.boolean(),
    defaultChorePriority: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH'),
    defaultChoreFrequency: joi_1.default.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'),
    theme: joi_1.default.string().valid('light', 'dark'),
    language: joi_1.default.string().length(2),
    timezone: joi_1.default.string(),
});
exports.userPreferenceUpdateSchema = joi_1.default.object({
    choreAssignedNotif: joi_1.default.boolean(),
    choreCompletedNotif: joi_1.default.boolean(),
    choreDueSoonNotif: joi_1.default.boolean(),
    householdInviteNotif: joi_1.default.boolean(),
    defaultChorePriority: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH'),
    defaultChoreFrequency: joi_1.default.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'),
    theme: joi_1.default.string().valid('light', 'dark'),
    language: joi_1.default.string().length(2),
    timezone: joi_1.default.string(),
});
// Household Validation Schemas
exports.householdSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
});
exports.createHouseholdSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
});
exports.updateHouseholdSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).optional(),
});
// Household Member Validation Schemas
exports.householdMemberSchema = joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
    role: joi_1.default.string().valid('ADMIN', 'MEMBER').required(),
});
// Household Invitation Validation Schemas
exports.householdInvitationSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
});
// Chore Validation Schemas
exports.choreSchema = joi_1.default.object({
    title: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(500).allow(null),
    timeEstimate: joi_1.default.number().integer().min(1).allow(null),
    frequency: joi_1.default.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM').required(),
    priority: joi_1.default.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
    dueDate: joi_1.default.date().iso().allow(null),
    assignedTo: joi_1.default.array().items(joi_1.default.string().uuid()),
});
exports.createChoreSchema = joi_1.default.object({
    title: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(500).allow(null),
    householdId: joi_1.default.string().uuid().required(),
    dueDate: joi_1.default.date().iso().allow(null),
    status: joi_1.default.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
    recurrence: joi_1.default.string().optional(),
    priority: joi_1.default.number().min(1).max(3).optional(),
    assignedUserIds: joi_1.default.array().items(joi_1.default.string().uuid()).optional(),
});
exports.updateChoreSchema = joi_1.default.object({
    title: joi_1.default.string().min(2).max(100).optional(),
    description: joi_1.default.string().max(500).allow(null).optional(),
    dueDate: joi_1.default.date().iso().allow(null).optional(),
    status: joi_1.default.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
    recurrence: joi_1.default.string().optional(),
    priority: joi_1.default.number().min(1).max(3).optional(),
    assignedUserIds: joi_1.default.array().items(joi_1.default.string().uuid()).optional(),
});
// Subtask Validation Schemas
exports.subtaskSchema = joi_1.default.object({
    title: joi_1.default.string().required(),
    status: joi_1.default.string().valid('PENDING', 'COMPLETED').optional(),
});
exports.createSubtaskSchema = joi_1.default.object({
    choreId: joi_1.default.string().uuid().required(),
    title: joi_1.default.string().required(),
    status: joi_1.default.string().valid('PENDING', 'COMPLETED').optional(),
});
exports.updateSubtaskSchema = joi_1.default.object({
    title: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('PENDING', 'COMPLETED').optional(),
});
// Message Validation Schemas
exports.messageSchema = joi_1.default.object({
    content: joi_1.default.string().max(1000).required(),
    parentMessageId: joi_1.default.string().uuid().allow(null),
});
exports.createMessageSchema = joi_1.default.object({
    householdId: joi_1.default.string().uuid().required(),
    authorId: joi_1.default.string().uuid().required(),
    content: joi_1.default.string().required(),
});
exports.replyMessageSchema = joi_1.default.object({
    content: joi_1.default.string().required(),
});
// Notification Validation Schemas
exports.notificationSchema = joi_1.default.object({
    type: joi_1.default.string().valid('CHORE_ASSIGNED', 'CHORE_COMPLETED', 'CHORE_DUE_SOON', 'HOUSEHOLD_INVITE').required(),
    message: joi_1.default.string().max(200).allow(null),
});
exports.createNotificationSchema = joi_1.default.object({
    type: joi_1.default.string().required(),
    message: joi_1.default.string().required(),
    userId: joi_1.default.string().uuid().required(),
});
exports.updateNotificationSchema = joi_1.default.object({
    isRead: joi_1.default.boolean().optional(),
});
// Shared Expense Validation Schemas
exports.sharedFundSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
    initialBalance: joi_1.default.number().min(0),
    currency: joi_1.default.string().length(3).default('USD'),
});
exports.sharedFundTransactionSchema = joi_1.default.object({
    amount: joi_1.default.number().required(),
    type: joi_1.default.string().valid('DEPOSIT', 'WITHDRAWAL').required(),
    description: joi_1.default.string().max(200).allow(null),
});
exports.createExpenseSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
    initialBalance: joi_1.default.number().min(0).optional(),
    currency: joi_1.default.string().length(3).optional(),
});
exports.updateExpenseSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).optional(),
    initialBalance: joi_1.default.number().min(0).optional(),
    currency: joi_1.default.string().length(3).optional(),
});
exports.createTransactionSchema = joi_1.default.object({
    expenseId: joi_1.default.string().uuid().required(),
    amount: joi_1.default.number().required(),
    type: joi_1.default.string().valid('DEPOSIT', 'WITHDRAWAL').required(),
    description: joi_1.default.string().max(200).allow(null).optional(),
});
// Event Validation Schemas
exports.eventSchema = joi_1.default.object({
    title: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(500).allow(null),
    startTime: joi_1.default.date().iso().required(),
    endTime: joi_1.default.date().iso().greater(joi_1.default.ref('startTime')).required(),
});
exports.createEventSchema = joi_1.default.object({
    title: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(500).allow(null).optional(),
    startTime: joi_1.default.date().iso().required(),
    endTime: joi_1.default.date().iso().greater(joi_1.default.ref('startTime')).required(),
});
exports.updateEventSchema = joi_1.default.object({
    title: joi_1.default.string().min(2).max(100).optional(),
    description: joi_1.default.string().max(500).allow(null).optional(),
    startTime: joi_1.default.date().iso().optional(),
    endTime: joi_1.default.date().iso().greater(joi_1.default.ref('startTime')).optional(),
});
// Tag Validation Schemas
exports.tagSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(30).required(),
    color: joi_1.default.string().regex(/^#[0-9A-Fa-f]{6}$/).allow(null),
});
// Calendar Integration Validation Schemas
exports.calendarIntegrationSchema = joi_1.default.object({
    provider: joi_1.default.string().valid('GOOGLE', 'APPLE').required(),
    accessToken: joi_1.default.string().required(),
    refreshToken: joi_1.default.string().allow(null),
    expiresAt: joi_1.default.date().iso().allow(null),
});
exports.connectCalendarSchema = joi_1.default.object({
    provider: joi_1.default.string().valid('GOOGLE', 'APPLE').required(),
    accessToken: joi_1.default.string().required(),
    refreshToken: joi_1.default.string().allow(null).optional(),
    expiresAt: joi_1.default.date().iso().allow(null).optional(),
});
// Attachment Validation Schemas
exports.attachmentSchema = joi_1.default.object({
    filename: joi_1.default.string().required(),
    mimeType: joi_1.default.string().required(),
    size: joi_1.default.number().integer().positive().required(),
});
// OAuth Integration Validation Schemas
exports.createOAuthIntegrationSchema = joi_1.default.object({
    provider: joi_1.default.string().valid('GOOGLE', 'FACEBOOK', 'APPLE').required(),
    accessToken: joi_1.default.string().required(),
    refreshToken: joi_1.default.string().allow(null).optional(),
    expiresAt: joi_1.default.date().iso().allow(null).optional(),
});
// Audit Log Validation Schemas
exports.auditLogSchema = joi_1.default.object({
    action: joi_1.default.string().required(),
    details: joi_1.default.object().allow(null),
});
// Activity Validation Rules
exports.activityValidationRules = {
    getRecentActivities: joi_1.default.object({
        householdId: joi_1.default.string().uuid().required(),
    }),
    getChoreActivities: joi_1.default.object({
        choreId: joi_1.default.string().uuid().required(),
    }),
    getUserActivities: joi_1.default.object({
        userId: joi_1.default.string().uuid().required(),
    }),
    createActivity: joi_1.default.object({
        choreId: joi_1.default.string().uuid().required(),
        userId: joi_1.default.string().uuid().required(),
        action: joi_1.default.string().required(),
    }),
};
// Export all schemas
exports.default = {
    userSchema: exports.userSchema,
    registerSchema: exports.registerSchema,
    loginSchema: exports.loginSchema,
    userPreferenceSchema: exports.userPreferenceSchema,
    userPreferenceUpdateSchema: exports.userPreferenceUpdateSchema,
    householdSchema: exports.householdSchema,
    createHouseholdSchema: exports.createHouseholdSchema,
    updateHouseholdSchema: exports.updateHouseholdSchema,
    householdMemberSchema: exports.householdMemberSchema,
    householdInvitationSchema: exports.householdInvitationSchema,
    choreSchema: exports.choreSchema,
    createChoreSchema: exports.createChoreSchema,
    updateChoreSchema: exports.updateChoreSchema,
    subtaskSchema: exports.subtaskSchema,
    createSubtaskSchema: exports.createSubtaskSchema,
    updateSubtaskSchema: exports.updateSubtaskSchema,
    messageSchema: exports.messageSchema,
    createMessageSchema: exports.createMessageSchema,
    replyMessageSchema: exports.replyMessageSchema,
    notificationSchema: exports.notificationSchema,
    createNotificationSchema: exports.createNotificationSchema,
    updateNotificationSchema: exports.updateNotificationSchema,
    sharedFundSchema: exports.sharedFundSchema,
    sharedFundTransactionSchema: exports.sharedFundTransactionSchema,
    createExpenseSchema: exports.createExpenseSchema,
    updateExpenseSchema: exports.updateExpenseSchema,
    createTransactionSchema: exports.createTransactionSchema,
    eventSchema: exports.eventSchema,
    createEventSchema: exports.createEventSchema,
    updateEventSchema: exports.updateEventSchema,
    tagSchema: exports.tagSchema,
    calendarIntegrationSchema: exports.calendarIntegrationSchema,
    connectCalendarSchema: exports.connectCalendarSchema,
    attachmentSchema: exports.attachmentSchema,
    createOAuthIntegrationSchema: exports.createOAuthIntegrationSchema,
    auditLogSchema: exports.auditLogSchema,
    activityValidationRules: exports.activityValidationRules,
};
