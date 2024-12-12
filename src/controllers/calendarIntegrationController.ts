import { Response, NextFunction } from 'express';
import * as calendarIntegrationService from '../services/calendarIntegrationService';
import { AuthenticatedRequest } from '../types';

/**
 * CalendarIntegrationController handles all operations related to calendar synchronization.
 */
export class CalendarIntegrationController {
  /**
   * Syncs the household calendar with the user's personal calendar.
   */
  static async syncWithPersonalCalendar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const { accessToken } = req.body; // Assuming accessToken is provided in the request body

      if (!accessToken) {
        throw new Error('Access token is required for synchronization.');
      }

      const syncResult =
        await calendarIntegrationService.syncWithPersonalCalendar(
          householdId,
          req.user!.id,
          accessToken
        );

      res.status(200).json({ data: syncResult });
    } catch (error) {
      next(error);
    }
  }
}
