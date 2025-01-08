import { Response, NextFunction } from "express";
import * as notificationService from "../services/notificationService";
import { AuthenticatedRequest } from "../types";
import {
  CreateNotificationDTO,
  UpdateNotificationDTO,
  Notification,
} from "@shared/types";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../middlewares/errorHandler";

/**
 * NotificationController handles all CRUD operations related to notifications.
 */
export class NotificationController {
  /**
   * Retrieves all notifications for the authenticated user.
   */
  static async getNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("User not authenticated");
      }

      const response = await notificationService.getNotifications(req.user.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new notification for a user.
   */
  static async createNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("User not authenticated");
      }

      const notificationData: CreateNotificationDTO = {
        ...req.body,
        userId: req.user.id,
      };

      const response = await notificationService.createNotification(
        notificationData
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marks a specific notification as read.
   */
  static async markAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        throw new BadRequestError("Notification ID is required");
      }

      const response = await notificationService.markAsRead(
        req.user.id,
        notificationId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a specific notification.
   */
  static async deleteNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        throw new BadRequestError("Notification ID is required");
      }

      await notificationService.deleteNotification(req.user.id, notificationId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves notification settings for the authenticated user or household.
   */
  static async getNotificationSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { householdId } = req.params;
      if (!householdId) {
        throw new BadRequestError("Household ID is required");
      }

      const response = await notificationService.getNotificationSettings(
        req.user.id,
        householdId
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates notification settings.
   */
  static async updateNotificationSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { settingsId } = req.params;
      if (!settingsId) {
        throw new BadRequestError("Settings ID is required");
      }

      const settingsData = req.body;
      const response = await notificationService.updateNotificationSettings(
        settingsId,
        settingsData
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
