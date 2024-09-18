import { Response, NextFunction } from 'express';
import * as calendarService from '../services/calendarIntegrationService';
import { AuthenticatedRequest } from '../types';

/**
 * CalendarIntegrationController handles all calendar-related operations.
 */
export class CalendarIntegrationController {
  /**
   * Retrieves all calendar events for a specific household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getCalendarEvents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const userId = req.user!.id;
      const events = await calendarService.getCalendarEvents(householdId, userId);
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new calendar event within a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async createEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const userId = req.user!.id;
      const eventData = req.body;
      const event = await calendarService.createEvent(householdId, eventData, userId);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing calendar event.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;
      const updatedEvent = await calendarService.updateEvent(householdId, eventId, updateData, userId);
      res.status(200).json(updatedEvent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a calendar event from a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId } = req.params;
      const userId = req.user!.id;
      await calendarService.deleteEvent(householdId, eventId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Syncs the household calendar with the user's personal calendar.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async syncWithPersonalCalendar(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const userId = req.user!.id;
      const { provider, accessToken } = req.body; // e.g., Google, Apple
      const syncResult = await calendarService.syncWithPersonalCalendar(
        householdId,
        userId,
        provider,
        accessToken
      );
      res.status(200).json(syncResult);
    } catch (error) {
      next(error);
    }
  }
}