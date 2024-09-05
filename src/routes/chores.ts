import express from 'express';
import {
  createChore,
  getHouseholdChores,
  getChoreDetails,
  updateChore,
  deleteChore,
  completeChore,
} from '../controllers/choreController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { createChoreSchema, updateChoreSchema } from '../utils/validators';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Create a new chore
router.post('/households/:household_id/chores', validateRequest(createChoreSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    createChore(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}); 

// Get all chores for a household
router.get('/households/:household_id/chores', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getHouseholdChores(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get details of a specific chore
router.get('/chores/:chore_id', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getChoreDetails(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update a chore
router.put('/chores/:chore_id', validateRequest(updateChoreSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    updateChore(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Delete a chore
router.delete('/chores/:chore_id', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    deleteChore(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Complete a chore
router.post('/chores/:chore_id/complete', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    completeChore(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;