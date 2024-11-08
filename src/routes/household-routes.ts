import { Router } from "express";
import { HouseholdController } from "../controllers/HouseholdController";
import authMiddleware from "../middlewares/authMiddleware";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import {
  createHouseholdSchema,
  updateHouseholdSchema,
  addMemberSchema,
} from "../utils/validationSchemas";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @route   GET /api/households/selected
 * @desc    Retrieve households selected by the user
 * @access  Protected
 */
router.get(
  "/selected",
  authMiddleware,
  asyncHandler(HouseholdController.getSelectedHouseholds)
);

/**
 * @route   GET /api/households/invitations
 * @desc    Get all pending invitations for the current user
 * @access  Protected
 */
router.get(
  "/invitations",
  authMiddleware,
  asyncHandler(HouseholdController.getInvitations)
);

/**
 * @route   GET /api/households
 * @desc    Retrieve all households for the authenticated user
 * @access  Protected
 */
router.get(
  "/",
  authMiddleware,
  asyncHandler(HouseholdController.getUserHouseholds)
);

/**
 * @route   POST /api/households
 * @desc    Create a new household
 * @access  Protected
 */
router.post(
  "/",
  authMiddleware,
  validate(createHouseholdSchema),
  asyncHandler(HouseholdController.createHousehold)
);

/**
 * @route   GET /api/households/:householdId
 * @desc    Retrieve details of a specific household
 * @access  Protected
 */
router.get(
  "/:householdId",
  authMiddleware,
  asyncHandler(HouseholdController.getHousehold)
);

/**
 * @route   PATCH /api/households/:householdId
 * @desc    Update an existing household
 * @access  Protected, Admin access required
 */
router.patch(
  "/:householdId",
  authMiddleware,
  rbacMiddleware("ADMIN"),
  validate(updateHouseholdSchema),
  asyncHandler(HouseholdController.updateHousehold)
);

/**
 * @route   DELETE /api/households/:householdId
 * @desc    Delete a household
 * @access  Protected, Admin access required
 */
router.delete(
  "/:householdId",
  authMiddleware,
  rbacMiddleware("ADMIN"),
  asyncHandler(HouseholdController.deleteHousehold)
);

/**
 * @route   POST /api/households/:householdId/members
 * @desc    Add a new member to the household
 * @access  Protected, Admin access required
 */
router.post(
  "/:householdId/members",
  authMiddleware,
  rbacMiddleware("ADMIN"),
  validate(addMemberSchema),
  asyncHandler(HouseholdController.addMember)
);

/**
 * @route   GET /api/households/:householdId/members
 * @desc    Retrieve all members of a specific household
 * @access  Protected
 */
router.get(
  "/:householdId/members",
  authMiddleware,
  asyncHandler(HouseholdController.getMembers)
);

/**
 * @route   DELETE /api/households/:householdId/members/:memberId
 * @desc    Remove a member from the household
 * @access  Protected, Admin access required
 */
router.delete(
  "/:householdId/members/:memberId",
  authMiddleware,
  rbacMiddleware("ADMIN"),
  asyncHandler(HouseholdController.removeMember)
);

/**
 * @route   PATCH /api/households/:householdId/members/:memberId/status
 * @desc    Update the status of a household member (e.g., accept invitation)
 * @access  Protected
 */
router.patch(
  "/:householdId/members/:memberId/status",
  authMiddleware,
  asyncHandler(HouseholdController.acceptOrRejectInvitation)
);

/**
 * @route   PATCH /api/households/:householdId/members/:memberId/role
 * @desc    Update a household member role
 * @access  Protected
 */
router.patch(
  "/:householdId/members/:memberId/role",
  authMiddleware,
  asyncHandler(HouseholdController.updateMemberRole)
);

/**
 * @route   PATCH /api/households/:householdId/members/:memberId/selection
 * @desc    Update the selection of a household member
 * @access  Protected
 */
router.patch(
  "/:householdId/members/:memberId/selection",
  authMiddleware,
  asyncHandler(HouseholdController.updateSelectedHousehold)
);

/**
 * @route POST /api/households/:householdId/invitations
 * @desc Send a household invitation to a user
 * @access Protected, Admin access required
 */
router.post(
  "/:householdId/invitations",
  authMiddleware,
  rbacMiddleware("ADMIN"),
  asyncHandler(HouseholdController.sendInvitation)
);

export default router;
