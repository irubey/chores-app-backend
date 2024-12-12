import { Response, NextFunction } from 'express';
import * as calendarEventService from '../services/calendarEventService';
import { AuthenticatedRequest } from '../types';
import { CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@shared/types';

/**
 * CalendarEventController handles all CRUD operations related to general calendar events.
 */
export class CalendarEventController {
  /**
   * Retrieves all general calendar events for a household.
   */
  static async getCalendarEvents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const response = await calendarEventService.getCalendarEvents(
        householdId,
        req.user!.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new general calendar event.
   */
  static async createCalendarEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId } = req.params;
      const eventData: CreateCalendarEventDTO = req.body;
      const response = await calendarEventService.createCalendarEvent(
        householdId,
        eventData,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific general calendar event.
   */
  static async getEventById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId } = req.params;
      const response = await calendarEventService.getEventById(
        householdId,
        eventId,
        req.user!.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing general calendar event.
   */
  static async updateEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId } = req.params;
      const updateData: UpdateCalendarEventDTO = req.body;
      const response = await calendarEventService.updateEvent(
        householdId,
        eventId,
        updateData,
        req.user!.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a general calendar event.
   */
  static async deleteEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId } = req.params;
      await calendarEventService.deleteCalendarEvent(
        householdId,
        eventId,
        req.user!.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adds a reminder to a calendar event.
   */
  static async addReminder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId } = req.params;
      const reminderData = req.body;
      const response = await calendarEventService.addReminder(
        householdId,
        eventId,
        reminderData,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes a reminder from a calendar event.
   */
  static async removeReminder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, eventId, reminderId } = req.params;
      await calendarEventService.removeReminder(
        householdId,
        eventId,
        reminderId,
        req.user!.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves events for a specific date.
   */
  static async getEventsByDate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, date } = req.params;
      const response = await calendarEventService.getEventsByDate(
        householdId,
        new Date(date),
        req.user!.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
