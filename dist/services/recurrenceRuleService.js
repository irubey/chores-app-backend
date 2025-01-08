"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecurrenceRule = createRecurrenceRule;
exports.getRecurrenceRule = getRecurrenceRule;
exports.updateRecurrenceRule = updateRecurrenceRule;
exports.deleteRecurrenceRule = deleteRecurrenceRule;
exports.listRecurrenceRules = listRecurrenceRules;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const servicesUtils_1 = require("../utils/servicesUtils");
/**
 * Creates a new recurrence rule.
 */
async function createRecurrenceRule(data) {
    logger_1.default.debug("Creating recurrence rule", { data });
    try {
        const rule = await database_1.default.recurrenceRule.create({
            data: {
                frequency: data.frequency,
                interval: data.interval,
                byWeekDay: data.byWeekDay || [],
                byMonthDay: data.byMonthDay || [],
                bySetPos: data.bySetPos,
                count: data.count,
                until: data.until,
                customRuleString: data.customRuleString,
            },
        });
        logger_1.default.info("Successfully created recurrence rule", { ruleId: rule.id });
        return (0, servicesUtils_1.wrapResponse)(rule);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "create recurrence rule");
    }
}
/**
 * Retrieves a recurrence rule by ID.
 */
async function getRecurrenceRule(ruleId) {
    logger_1.default.debug("Fetching recurrence rule", { ruleId });
    try {
        const rule = await database_1.default.recurrenceRule.findUnique({
            where: { id: ruleId },
        });
        if (!rule) {
            logger_1.default.warn("Recurrence rule not found", { ruleId });
            throw new errorHandler_1.NotFoundError("Recurrence rule not found");
        }
        logger_1.default.info("Successfully retrieved recurrence rule", { ruleId });
        return (0, servicesUtils_1.wrapResponse)(rule);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "fetch recurrence rule", {
            ruleId,
        });
    }
}
/**
 * Updates an existing recurrence rule.
 */
async function updateRecurrenceRule(ruleId, data) {
    logger_1.default.debug("Updating recurrence rule", { ruleId, data });
    try {
        const rule = await database_1.default.recurrenceRule.update({
            where: { id: ruleId },
            data: {
                frequency: data.frequency,
                interval: data.interval,
                byWeekDay: data.byWeekDay,
                byMonthDay: data.byMonthDay,
                bySetPos: data.bySetPos,
                count: data.count,
                until: data.until,
                customRuleString: data.customRuleString,
            },
        });
        logger_1.default.info("Successfully updated recurrence rule", { ruleId });
        return (0, servicesUtils_1.wrapResponse)(rule);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "update recurrence rule", {
            ruleId,
        });
    }
}
/**
 * Deletes a recurrence rule.
 */
async function deleteRecurrenceRule(ruleId) {
    logger_1.default.debug("Deleting recurrence rule", { ruleId });
    try {
        await database_1.default.recurrenceRule.delete({
            where: { id: ruleId },
        });
        logger_1.default.info("Successfully deleted recurrence rule", { ruleId });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "delete recurrence rule", {
            ruleId,
        });
    }
}
/**
 * Lists all recurrence rules.
 */
async function listRecurrenceRules() {
    logger_1.default.debug("Listing all recurrence rules");
    try {
        const rules = await database_1.default.recurrenceRule.findMany();
        logger_1.default.info("Successfully retrieved recurrence rules", {
            count: rules.length,
        });
        return (0, servicesUtils_1.wrapResponse)(rules);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, "list recurrence rules");
    }
}
