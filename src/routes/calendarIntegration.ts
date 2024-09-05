import express from 'express';
import {
  connectCalendar,
  disconnectCalendar,
  getCalendarIntegration,
  syncChores
} from '../controllers/calendarIntegrationController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { connectCalendarSchema } from '../utils/validators';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Connect a calendar
router.post('/connect', validateRequest(connectCalendarSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    connectCalendar(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Disconnect a calendar
router.post('/disconnect', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    disconnectCalendar(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get calendar integration details
router.get('/', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getCalendarIntegration(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Sync chores with the connected calendar
router.post('/sync', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    syncChores(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;