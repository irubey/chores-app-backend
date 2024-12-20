import prisma from "../config/database";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { NotFoundError } from "../middlewares/errorHandler";
import { RecurrenceRule } from "@prisma/client";
import logger from "../utils/logger";
import { wrapResponse, handleServiceError } from "../utils/servicesUtils";
import {
  CreateRecurrenceRuleDTO,
  UpdateRecurrenceRuleDTO,
} from "@shared/types";

/**
 * Creates a new recurrence rule.
 */
export async function createRecurrenceRule(
  data: CreateRecurrenceRuleDTO
): Promise<ApiResponse<RecurrenceRule>> {
  logger.debug("Creating recurrence rule", { data });

  try {
    const rule = await prisma.recurrenceRule.create({
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

    logger.info("Successfully created recurrence rule", { ruleId: rule.id });
    return wrapResponse(rule);
  } catch (error) {
    return handleServiceError(error, "create recurrence rule") as never;
  }
}

/**
 * Retrieves a recurrence rule by ID.
 */
export async function getRecurrenceRule(
  ruleId: string
): Promise<ApiResponse<RecurrenceRule>> {
  logger.debug("Fetching recurrence rule", { ruleId });

  try {
    const rule = await prisma.recurrenceRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      logger.warn("Recurrence rule not found", { ruleId });
      throw new NotFoundError("Recurrence rule not found");
    }

    logger.info("Successfully retrieved recurrence rule", { ruleId });
    return wrapResponse(rule);
  } catch (error) {
    return handleServiceError(error, "fetch recurrence rule", {
      ruleId,
    }) as never;
  }
}

/**
 * Updates an existing recurrence rule.
 */
export async function updateRecurrenceRule(
  ruleId: string,
  data: UpdateRecurrenceRuleDTO
): Promise<ApiResponse<RecurrenceRule>> {
  logger.debug("Updating recurrence rule", { ruleId, data });

  try {
    const rule = await prisma.recurrenceRule.update({
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

    logger.info("Successfully updated recurrence rule", { ruleId });
    return wrapResponse(rule);
  } catch (error) {
    return handleServiceError(error, "update recurrence rule", {
      ruleId,
    }) as never;
  }
}

/**
 * Deletes a recurrence rule.
 */
export async function deleteRecurrenceRule(
  ruleId: string
): Promise<ApiResponse<void>> {
  logger.debug("Deleting recurrence rule", { ruleId });

  try {
    await prisma.recurrenceRule.delete({
      where: { id: ruleId },
    });

    logger.info("Successfully deleted recurrence rule", { ruleId });
    return wrapResponse(undefined);
  } catch (error) {
    return handleServiceError(error, "delete recurrence rule", {
      ruleId,
    }) as never;
  }
}

/**
 * Lists all recurrence rules.
 */
export async function listRecurrenceRules(): Promise<
  ApiResponse<RecurrenceRule[]>
> {
  logger.debug("Listing all recurrence rules");

  try {
    const rules = await prisma.recurrenceRule.findMany();
    logger.info("Successfully retrieved recurrence rules", {
      count: rules.length,
    });
    return wrapResponse(rules);
  } catch (error) {
    return handleServiceError(error, "list recurrence rules") as never;
  }
}
