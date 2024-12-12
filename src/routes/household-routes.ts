import { Router } from 'express';
import * as householdController from '../controllers/HouseholdController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createHouseholdSchema,
  updateHouseholdSchema,
  addMemberSchema,
  emailSchema,
} from '../utils/validationSchemas';
import { HouseholdRole } from '@shared/enums';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// User-specific routes (must be before parameterized routes)
router.get(
  '/user/households',
  asyncHandler(householdController.getUserHouseholds)
);
router.get(
  '/user/invitations',
  asyncHandler(householdController.getPendingInvitations)
);

// Household management
router.post(
  '/',
  validate(createHouseholdSchema),
  asyncHandler(householdController.createHousehold)
);

router.get(
  '/:householdId',
  rbacMiddleware([HouseholdRole.ADMIN, HouseholdRole.MEMBER]),
  asyncHandler(householdController.getHouseholdById)
);

router.patch(
  '/:householdId',
  rbacMiddleware([HouseholdRole.ADMIN]),
  validate(updateHouseholdSchema),
  asyncHandler(householdController.updateHousehold)
);

router.delete(
  '/:householdId',
  rbacMiddleware([HouseholdRole.ADMIN]),
  asyncHandler(householdController.deleteHousehold)
);

// Member management
router.get(
  '/:householdId/members',
  rbacMiddleware([HouseholdRole.ADMIN, HouseholdRole.MEMBER]),
  asyncHandler(householdController.getMembers)
);

router.post(
  '/:householdId/members',
  rbacMiddleware([HouseholdRole.ADMIN]),
  validate(addMemberSchema),
  asyncHandler(householdController.addMember)
);

router.delete(
  '/:householdId/members/:memberId',
  rbacMiddleware([HouseholdRole.ADMIN]),
  asyncHandler(householdController.removeMember)
);

// Invitation management
router.post(
  '/:householdId/invitations/send',
  rbacMiddleware([HouseholdRole.ADMIN]),
  validate(emailSchema),
  asyncHandler(householdController.sendInvitationEmail)
);

router.post(
  '/:householdId/invitations/accept',
  asyncHandler(householdController.acceptInvitation)
);

router.post(
  '/:householdId/invitations/reject',
  asyncHandler(householdController.rejectInvitation)
);

export default router;
