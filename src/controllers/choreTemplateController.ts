import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as choreTemplateService from '../services/choreTemplateService';

export const createChoreTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templateData = req.body;
    const choreTemplate = await choreTemplateService.createChoreTemplate(templateData);
    res.status(201).json(choreTemplate);
  } catch (error) {
    console.error('Error creating chore template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChoreTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const choreTemplates = await choreTemplateService.getChoreTemplates();
    res.json(choreTemplates);
  } catch (error) {
    console.error('Error fetching chore templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChoreTemplateDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { template_id } = req.params;
    const choreTemplate = await choreTemplateService.getChoreTemplateDetails(template_id);
    res.json(choreTemplate);
  } catch (error) {
    console.error('Error fetching chore template details:', error);
    if (error instanceof Error && error.message === 'Chore template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateChoreTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { template_id } = req.params;
    const templateData = req.body;
    const updatedChoreTemplate = await choreTemplateService.updateChoreTemplate(template_id, templateData);
    res.json(updatedChoreTemplate);
  } catch (error) {
    console.error('Error updating chore template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteChoreTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { template_id } = req.params;
    await choreTemplateService.deleteChoreTemplate(template_id);
    res.json({ message: 'Chore template deleted successfully' });
  } catch (error) {
    console.error('Error deleting chore template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};