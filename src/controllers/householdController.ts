import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as householdService from '../services/householdService';

export const createHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const household = await householdService.createHousehold(name, userId);

    res.status(201).json({
      id: household.id,
      name: household.name,
      created_at: household.created_at,
      status: 'ACTIVE',
    });
  } catch (error) {
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHouseholds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const households = await householdService.getHouseholds(userId);
    res.json(households);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addHouseholdMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { household_id } = req.params;
    const { email, role } = req.body;
    const inviterId = req.user.id;

    await householdService.addHouseholdMember(household_id, inviterId, email, role);
    res.json({ message: 'Invitation sent' });
  } catch (error) {
    console.error('Error adding household member:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const removeHouseholdMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { household_id, user_id } = req.params;
    const removerId = req.user.id;

    await householdService.removeHouseholdMember(household_id, removerId, user_id);
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Error removing household member:', error);
    if (error instanceof Error) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};