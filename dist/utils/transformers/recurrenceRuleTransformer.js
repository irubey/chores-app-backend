"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformRecurrenceRule = transformRecurrenceRule;
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
function isValidRecurrenceFrequency(frequency) {
    return Object.values(enums_1.RecurrenceFrequency).includes(frequency);
}
function transformRecurrenceRule(rule) {
    if (!isValidRecurrenceFrequency(rule.frequency)) {
        throw new Error(`Invalid recurrence frequency: ${rule.frequency}`);
    }
    return {
        id: rule.id,
        frequency: rule.frequency,
        interval: rule.interval,
        byWeekDay: rule.byWeekDay,
        byMonthDay: rule.byMonthDay,
        bySetPos: rule.bySetPos ?? undefined,
        count: rule.count ?? undefined,
        until: rule.until ?? undefined,
        customRuleString: rule.customRuleString ?? undefined,
    };
}
