import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as calendarIntegrationService from '../services/calendarIntegrationService';

export const connectCalendar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { provider, access_token, refresh_token, expires_at } = req.body;

    const calendarIntegration = await calendarIntegrationService.connectCalendar(
      userId,
      provider,
      access_token,
      refresh_token,
      expires_at
    );

    res.json({ message: 'Calendar connected successfully', calendarIntegration });
  } catch (error) {
    console.error('Error connecting calendar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const disconnectCalendar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    await calendarIntegrationService.disconnectCalendar(userId);

    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCalendarIntegration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const calendarIntegration = await calendarIntegrationService.getCalendarIntegration(userId);

    if (!calendarIntegration) {
      return res.status(404).json({ error: 'Calendar integration not found' });
    }

    res.json(calendarIntegration);
  } catch (error) {
    console.error('Error fetching calendar integration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const syncChores = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const result = await calendarIntegrationService.syncChores(userId);

    res.json(result);
  } catch (error) {
    console.error('Error syncing chores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};