import { RecurrenceRule } from '@shared/types';
import { PrismaRecurrenceRuleWithFullRelations } from './transformerPrismaTypes';
import { RecurrenceFrequency, DaysOfWeek } from '@shared/enums';

function isValidRecurrenceFrequency(
  frequency: string
): frequency is RecurrenceFrequency {
  return Object.values(RecurrenceFrequency).includes(
    frequency as RecurrenceFrequency
  );
}

export function transformRecurrenceRule(
  rule: PrismaRecurrenceRuleWithFullRelations
): RecurrenceRule {
  if (!isValidRecurrenceFrequency(rule.frequency)) {
    throw new Error(`Invalid recurrence frequency: ${rule.frequency}`);
  }

  return {
    id: rule.id,
    frequency: rule.frequency as RecurrenceFrequency,
    interval: rule.interval,
    byWeekDay: rule.byWeekDay as DaysOfWeek[],
    byMonthDay: rule.byMonthDay,
    bySetPos: rule.bySetPos ?? undefined,
    count: rule.count ?? undefined,
    until: rule.until ?? undefined,
    customRuleString: rule.customRuleString ?? undefined,
  };
}
