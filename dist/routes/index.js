"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth-routes"));
const user_routes_1 = __importDefault(require("./user-routes"));
const household_routes_1 = __importDefault(require("./household-routes"));
const chore_routes_1 = __importDefault(require("./chore-routes"));
const subtask_routes_1 = __importDefault(require("./subtask-routes"));
const expense_routes_1 = __importDefault(require("./expense-routes"));
const transaction_routes_1 = __importDefault(require("./transaction-routes"));
const notification_routes_1 = __importDefault(require("./notification-routes"));
const calendar_integration_routes_1 = __importDefault(require("./calendar-integration-routes"));
const calendar_event_routes_1 = __importDefault(require("./calendar-event-routes"));
const chore_event_routes_1 = __importDefault(require("./chore-event-routes"));
const thread_routes_1 = __importDefault(require("./thread-routes"));
const recurrence_rule_routes_1 = __importDefault(require("./recurrence-rule-routes"));
const health_routes_1 = __importDefault(require("./health-routes"));
const router = (0, express_1.Router)();
/**
 * @route   /api/auth
 * @desc    Authentication routes
 */
router.use("/auth", auth_routes_1.default);
/**
 * @route   /api/users
 * @desc    User management routes
 */
router.use("/users", user_routes_1.default);
/**
 * @route   /api/households
 * @desc    Household management routes
 */
router.use("/households", household_routes_1.default);
/**
 * @route   /api/households/:householdId/chores
 * @desc    Chore management routes
 */
router.use("/households/:householdId/chores", chore_routes_1.default);
/**
 * @route   /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Subtask management routes
 */
router.use("/households/:householdId/chores/:choreId/subtasks", subtask_routes_1.default);
/**
 * @route   /api/households/:householdId/expenses
 * @desc    Shared finances management routes
 */
router.use("/households/:householdId/expenses", expense_routes_1.default);
/**
 * @route   /api/households/:householdId/transactions
 * @desc    Transaction management routes
 */
router.use("/households/:householdId/transactions", transaction_routes_1.default);
/**
 * @route   /api/notifications
 * @desc    Notification management routes
 */
router.use("/notifications", notification_routes_1.default);
/**
 * @route   /api/households/:householdId/calendar
 * @desc    Calendar integration routes
 */
router.use("/households/:householdId/calendar", calendar_integration_routes_1.default);
/**
 * @route   /api/households/:householdId/calendar/events
 * @desc    Calendar event routes
 */
router.use("/households/:householdId/calendar/events", calendar_event_routes_1.default);
/**
 * @route   /api/households/:householdId/chores/:choreId/events
 * @desc    Chore event routes
 */
router.use("/households/:householdId/chores/:choreId/events", chore_event_routes_1.default);
/**
 * @route   /api/households/:householdId/threads
 * @desc    Thread management routes
 */
router.use("/households/:householdId/threads", thread_routes_1.default);
/**
 * @route   /api/recurrence-rules
 * @desc    Recurrence rule management routes
 */
router.use("/recurrence-rules", recurrence_rule_routes_1.default);
/**
 * @route   /api/health
 * @desc    Health check routes
 */
router.use("/health", health_routes_1.default);
exports.default = router;
