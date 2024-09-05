import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as badgeService from '../services/badgeService';

export const getAllBadges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const badges = await badgeService.getAllBadges();
    res.json(badges);
  } catch (error) {
    console.error('Error fetching all badges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserBadges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const badges = await badgeService.getUserBadges(userId);
    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const awardBadge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id, badge_id } = req.body;
    const awardedBadge = await badgeService.awardBadge(user_id, badge_id);
    res.status(201).json(awardedBadge);
  } catch (error) {
    console.error('Error awarding badge:', error);
    if (error instanceof Error && error.message === 'User already has this badge') {
      res.status(400).json({ error: 'User already has this badge' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const revokeBadge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { badge_id } = req.params;
    const user_id = req.user.id;
    await badgeService.revokeBadge(user_id, badge_id);
    res.json({ message: 'Badge revoked successfully' });
  } catch (error) {
    console.error('Error revoking badge:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ error: 'Badge not found or not awarded to the user' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};