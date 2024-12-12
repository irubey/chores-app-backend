import { Response, NextFunction } from 'express';
import * as choreEventService from '../services/choreEventService';
import { AuthenticatedRequest } from '../types';
import { CreateEventDTO, UpdateEventDTO } from '@shared/types';

/**
 * ChoreEventController handles all CRUD operations related to chore events.
 */
export class ChoreEventController {
  /**
   * Retrieves all events linked to a specific chore.
   */
  static async getChoreEvents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const response = await choreEventService.getChoreEvents(
        householdId,
        choreId,
        req.user!.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new event associated with a chore.
   */
  static async createChoreEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const choreEventData: CreateEventDTO = req.body;
      const response = await choreEventService.createChoreEvent(
        householdId,
        choreId,
        choreEventData,
        req.user!.id
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific chore event.
   */
  static async getChoreEventById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, eventId } = req.params;
      const response = await choreEventService.getChoreEventById(
        householdId,
        choreId,
        eventId,
        req.user!.id
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing chore-linked event.
   */
  static async updateChoreEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, eventId } = req.params;
      const updateData: UpdateEventDTO = req.body;
      const response = await choreEventService.updateChoreEvent(
        householdId,
        choreId,
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
   * Deletes a chore-linked event.
   */
  static async deleteChoreEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, eventId } = req.params;
      await choreEventService.deleteChoreEvent(
        householdId,
        choreId,
        eventId,
        req.user!.id
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates the status of a chore event.
   */
  static async updateChoreEventStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, eventId } = req.params;
      const { status } = req.body;
      const response = await choreEventService.updateChoreEventStatus(
        householdId,
        choreId,
        eventId,
        req.user!.id,
        status
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reschedules a chore event.
   */
  static async rescheduleChoreEvent(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId, eventId } = req.params;
      const { newStartTime, newEndTime } = req.body;
      const response = await choreEventService.rescheduleChoreEvent(
        householdId,
        choreId,
        eventId,
        req.user!.id,
        new Date(newStartTime),
        new Date(newEndTime)
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves upcoming chore events.
   */
  static async getUpcomingChoreEvents(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { householdId, choreId } = req.params;
      const { limit } = req.query;
      const response = await choreEventService.getUpcomingChoreEvents(
        householdId,
        choreId,
        req.user!.id,
        limit ? parseInt(limit as string, 10) : undefined
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
