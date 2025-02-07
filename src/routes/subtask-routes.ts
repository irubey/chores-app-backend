import { Router } from "express";
import { SubtaskController } from "../controllers/SubtaskController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import {
  createSubtaskSchema,
  updateSubtaskStatusSchema,
} from "../utils/validationSchemas";
import { asyncHandler } from "../utils/asyncHandler";
import { HouseholdRole } from "@shared/enums";

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Retrieve all subtasks for a specific chore
 * @access  Protected
 */
router.get(
  "/",
  authMiddleware,
  rbacMiddleware([HouseholdRole.ADMIN, HouseholdRole.MEMBER]),
  asyncHandler(SubtaskController.getSubtasks)
);

/**
 * @route   POST /api/households/:householdId/chores/:choreId/subtasks
 * @desc    Add a new subtask to a specific chore
 * @access  Protected, Write access required
 */
router.post(
  "/",
  authMiddleware,
  rbacMiddleware([HouseholdRole.ADMIN, HouseholdRole.MEMBER]),
  validate(createSubtaskSchema),
  asyncHandler(SubtaskController.addSubtask)
);

/**
 * @route   PATCH /api/households/:householdId/chores/:choreId/subtasks/:subtaskId
 * @desc    Update a specific subtask's details
 * @access  Protected, Write access required
 */
router.patch(
  "/:subtaskId",
  authMiddleware,
  rbacMiddleware([HouseholdRole.ADMIN, HouseholdRole.MEMBER]),
  validate(updateSubtaskStatusSchema),
  asyncHandler(SubtaskController.updateSubtask)
);

/**
 * @route   DELETE /api/households/:householdId/chores/:choreId/subtasks/:subtaskId
 * @desc    Delete a specific subtask from a chore
 * @access  Protected, Admin access required
 */
router.delete(
  "/:subtaskId",
  authMiddleware,
  rbacMiddleware([HouseholdRole.ADMIN]),
  asyncHandler(SubtaskController.deleteSubtask)
);

export default router;
