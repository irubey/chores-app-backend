import express from 'express';
import {
  getAllBadges,
  getUserBadges,
  awardBadge,
  revokeBadge
} from '../controllers/badgeController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { awardBadgeSchema } from '../utils/validators';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Get all available badges
router.get('/', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getAllBadges(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get user's badges
router.get('/user', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getUserBadges(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Award a badge to a user
router.post('/award', validateRequest(awardBadgeSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    awardBadge(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Revoke a badge from a user
router.delete('/revoke/:badge_id', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    revokeBadge(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;