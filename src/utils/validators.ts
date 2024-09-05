import Joi from 'joi';

export const createHouseholdSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
});

export const addMemberSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  role: Joi.string().valid('ADMIN', 'MEMBER').required(),
});

export const createChoreSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().optional().allow('').max(500),
  time_estimate: Joi.number().integer().min(1).max(1440).optional(),
  frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM').required(),
  assigned_to: Joi.string().uuid().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
});

export const updateChoreSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().allow('').max(500).optional(),
  time_estimate: Joi.number().integer().min(1).max(1440).optional(),
  frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM').optional(),
  assigned_to: Joi.string().uuid().optional().allow(null),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').optional(),
});


export const updateNotificationPreferencesSchema = Joi.object({
  notification_preferences: Joi.object({
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    chore_reminders: Joi.boolean().optional(),
    household_updates: Joi.boolean().optional(),
  }).required(),
});


export const updateUserProfileSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
});

export const updateUserPreferencesSchema = Joi.object({
  notification_preferences: Joi.object({
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    chore_reminders: Joi.boolean().optional(),
    household_updates: Joi.boolean().optional(),
  }).optional(),
  chore_preferences: Joi.object({
    preferred_chore_types: Joi.array().items(Joi.string()).optional(),
    max_chores_per_week: Joi.number().integer().min(1).optional(),
  }).optional(),
  theme: Joi.string().valid('light', 'dark').optional(),
}).min(1);


export const createChoreTemplateSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().optional().allow('').max(500),
  time_estimate: Joi.number().integer().min(1).optional(),
  frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM').required(),
});

export const updateChoreTemplateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().allow('').max(500).optional(),
  time_estimate: Joi.number().integer().min(1).optional(),
  frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM').optional(),
}).min(1);


export const connectCalendarSchema = Joi.object({
  provider: Joi.string().required().valid('GOOGLE', 'APPLE'),
  access_token: Joi.string().required(),
  refresh_token: Joi.string().optional(),
  expires_at: Joi.date().optional(),
});

export const awardBadgeSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  badge_id: Joi.string().uuid().required(),
});
