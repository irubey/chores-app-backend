import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as userService from '../services/userService';

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' });
    }
    const user = await userService.getUserProfile(userId);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    const updatedUser = await userService.updateUserProfile(userId, name);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Fetching user preferences for user:', req.user.id);
    const userId = req.user.id;
    const preferences = await userService.getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    if (error instanceof Error && error.message === 'User preferences not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateUserPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { notification_preferences, chore_preferences, theme } = req.body;
    const updatedPreferences = await userService.updateUserPreferences(userId, {
      notification_preferences,
      chore_preferences,
      theme,
    });
    res.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserBadges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const badges = await userService.getUserBadges(userId);
    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};