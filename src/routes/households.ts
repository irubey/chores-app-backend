import express from 'express';
import {
  createHousehold,
  getHouseholds,
  addHouseholdMember,
  removeHouseholdMember
} from '../controllers/householdController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { createHouseholdSchema, addMemberSchema } from '../utils/validators';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Create a new household
router.post('/', validateRequest(createHouseholdSchema), (req: express.Request, res: express.Response) => {
  if (isAuthenticatedRequest(req)) {
    createHousehold(req as AuthenticatedRequest, res);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get all households for the authenticated user
router.get('/', (req: express.Request, res: express.Response) => {
  if (isAuthenticatedRequest(req)) {
    getHouseholds(req as AuthenticatedRequest, res);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Add a new member to a household
router.post('/:household_id/members', validateRequest(addMemberSchema), (req: express.Request, res: express.Response) => {
  if (isAuthenticatedRequest(req)) {
    addHouseholdMember(req as AuthenticatedRequest, res);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Remove a member from a household
router.delete('/:household_id/members/:user_id', (req: express.Request, res: express.Response) => {
  if (isAuthenticatedRequest(req)) {
    removeHouseholdMember(req as AuthenticatedRequest, res);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

export default router;