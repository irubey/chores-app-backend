import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserBadges
} from '../controllers/userController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { updateUserProfileSchema, updateUserPreferencesSchema } from '../utils/validators';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Get user profile
router.get('/profile', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getUserProfile(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update user profile
router.put('/profile', validateRequest(updateUserProfileSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    updateUserProfile(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get user preferences
router.get('/preferences', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getUserPreferences(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update user preferences
router.put('/preferences', validateRequest(updateUserPreferencesSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    updateUserPreferences(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get user badges
router.get('/badges', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getUserBadges(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;