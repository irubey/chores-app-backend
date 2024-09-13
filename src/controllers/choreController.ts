import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as choreService from '../services/choreService';

export const createChore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { household_id } = req.params;
    const userId = req.user.id;
    const choreData = req.body;
    
    console.log('Backend - Received chore data:', choreData);
    
    const chore = await choreService.createChore(household_id, userId, choreData);
    
    console.log('Backend - Created chore:', chore);
    
    res.status(201).json(chore);
  } catch (error) {
    console.error('Error creating chore:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getHouseholdChores = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { household_id } = req.params;
    const userId = req.user.id;

    console.log('Backend - Fetching chores for household:', household_id);

    const chores = await choreService.getHouseholdChores(household_id, userId);

    console.log('Backend - Fetched chores:', chores);

    res.json(chores);
  } catch (error) {
    console.error('Error fetching household chores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChoreDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chore_id } = req.params;
    const chore = await choreService.getChoreDetails(chore_id);
    res.json(chore);
  } catch (error) {
    console.error('Error fetching chore details:', error);
    if (error instanceof Error && error.message === 'Chore not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateChore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chore_id } = req.params;
    const choreData = req.body;
    const updatedChore = await choreService.updateChore(chore_id, choreData);
    res.json(updatedChore);
  } catch (error) {
    console.error('Error updating chore:', error);
    if (error instanceof Error && (error.message === 'Chore not found' || error.message === 'One or more assigned users are not members of this household' || error.message === 'Invalid assigned_to field')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteChore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chore_id } = req.params;
    await choreService.deleteChore(chore_id);
    res.json({ message: 'Chore deleted successfully' });
  } catch (error) {
    console.error('Error deleting chore:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeChore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chore_id } = req.params;
    const userId = req.user.id;
    const updatedChore = await choreService.completeChore(chore_id, userId);
    res.json(updatedChore);
  } catch (error) {
    console.error('Error completing chore:', error);
    if (error instanceof Error && (error.message === 'Chore not found' || error.message === 'You are not a member of this household')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
