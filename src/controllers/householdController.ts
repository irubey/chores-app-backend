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

export const joinHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { household_id } = req.params;
    const userId = req.user.id;

    const household = await householdService.joinHousehold(household_id, userId);
    res.json(household);
  } catch (error) {
    console.error('Error joining household:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getHouseholdById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const household = await householdService.getHouseholdById(id);
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }
    res.json(household);
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the user is an admin of the household
    const isAdmin = await householdService.isUserAdmin(id, userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only administrators can delete households' });
    }

    const deletedHousehold = await householdService.deleteHousehold(id);
    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    console.error('Error deleting household:', error);
    if (error instanceof Error) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const leaveHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { household_id } = req.params;
    const userId = req.user.id;

    const household = await householdService.leaveHousehold(household_id, userId);
    res.json({ message: 'Successfully left the household', household });
  } catch (error) {
    console.error('Error leaving household:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};