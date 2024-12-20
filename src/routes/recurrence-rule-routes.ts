import express from "express";
import { RecurrenceRuleController } from "../controllers/recurrenceRuleController";

import { validate } from "../middlewares/validationMiddleware";
import { createRecurrenceRuleSchema } from "../utils/validationSchemas";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

/**
 * @route   GET /api/recurrence-rules
 * @desc    List all recurrence rules
 * @access  Protected
 */
router.get("/", asyncHandler(RecurrenceRuleController.listRecurrenceRules));

/**
 * @route   POST /api/recurrence-rules
 * @desc    Create a new recurrence rule
 * @access  Protected
 */
router.post(
  "/",
  validate(createRecurrenceRuleSchema),
  asyncHandler(RecurrenceRuleController.createRecurrenceRule)
);

/**
 * @route   GET /api/recurrence-rules/:ruleId
 * @desc    Get a recurrence rule by ID
 * @access  Protected
 */
router.get(
  "/:ruleId",
  asyncHandler(RecurrenceRuleController.getRecurrenceRule)
);

/**
 * @route   PATCH /api/recurrence-rules/:ruleId
 * @desc    Update a recurrence rule
 * @access  Protected
 */
router.patch(
  "/:ruleId",
  asyncHandler(RecurrenceRuleController.updateRecurrenceRule)
);

/**
 * @route   DELETE /api/recurrence-rules/:ruleId
 * @desc    Delete a recurrence rule
 * @access  Protected
 */
router.delete(
  "/:ruleId",
  asyncHandler(RecurrenceRuleController.deleteRecurrenceRule)
);

export default router;
