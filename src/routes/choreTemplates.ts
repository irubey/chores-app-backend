import express from 'express';
import {
  createChoreTemplate,
  getChoreTemplates,
  getChoreTemplateDetails,
  updateChoreTemplate,
  deleteChoreTemplate
} from '../controllers/choreTemplateController';
import { authMiddleware, AuthenticatedRequest, isAuthenticatedRequest } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validate';
import { createChoreTemplateSchema, updateChoreTemplateSchema } from '../utils/validators';
import { errorHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Create a new chore template
router.post('/', validateRequest(createChoreTemplateSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    createChoreTemplate(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get all chore templates
router.get('/', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getChoreTemplates(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get details of a specific chore template
router.get('/:template_id', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    getChoreTemplateDetails(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update a chore template
router.put('/:template_id', validateRequest(updateChoreTemplateSchema), (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    updateChoreTemplate(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Delete a chore template
router.delete('/:template_id', (req, res, next) => {
  if (isAuthenticatedRequest(req)) {
    deleteChoreTemplate(req, res).catch(next);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error handling middleware
router.use(errorHandler);

export default router;