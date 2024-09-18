import { Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { AuthenticatedRequest, CreateEventDTO, UpdateEventDTO } from '../types';

/**
 * EventController handles all CRUD operations related to events.
 */
export class EventController {
  /**
   * Retrieves all events for a specific household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const events = await eventService.getEvents(householdId, req.user.id);
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new event within a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async createEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const householdId = req.params.householdId;
      const eventData: CreateEventDTO = req.body;
      const event = await eventService.createEvent(householdId, eventData, req.user.id);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific event.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async getEventDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, eventId } = req.params;
      const event = await eventService.getEventById(householdId, eventId, req.user.id);
      if (!event) {
        throw new NotFoundError('Event not found');
      }
      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing event.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async updateEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, eventId } = req.params;
      const updateData: UpdateEventDTO = req.body;
      const updatedEvent = await eventService.updateEvent(householdId, eventId, updateData, req.user.id);
      if (!updatedEvent) {
        throw new NotFoundError('Event not found or you do not have permission to update it');
      }
      res.status(200).json(updatedEvent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an event from a household.
   * @param req Authenticated Express Request object
   * @param res Express Response object
   * @param next Express NextFunction for error handling
   */
  static async deleteEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Unauthorized');
      }
      const { householdId, eventId } = req.params;
      await eventService.deleteEvent(householdId, eventId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}