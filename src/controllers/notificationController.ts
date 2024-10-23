import { Response, NextFunction } from "express";
import * as notificationService from "../services/notificationService";
import { AuthenticatedRequest } from "../types";
import {
  CreateNotificationDTO,
  UpdateNotificationDTO,
  Notification,
} from "@shared/types";

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
      if (!req.user) {
        throw new Error("User not authenticated");
      }
      const notifications = await notificationService.getNotifications(
        req.user.id
      );
      res.status(200).json(notifications);
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
      const notificationData: CreateNotificationDTO = {
        userId: req.body.userId,
        type: req.body.type,
        message: req.body.message,
        isRead: req.body.isRead,
      };
      const notification = await notificationService.createNotification(
        notificationData
      );
      res.status(201).json(notification);
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
      if (!req.user) {
        throw new Error("User not authenticated");
      }
      const { notificationId } = req.params;
      const updateData: UpdateNotificationDTO = {
        isRead: true,
      };
      const updatedNotification = await notificationService.markAsRead(
        req.user.id,
        notificationId,
        updateData
      );
      res.status(200).json(updatedNotification);
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
      if (!req.user) {
        throw new Error("User not authenticated");
      }
      const { notificationId } = req.params;
      await notificationService.deleteNotification(req.user.id, notificationId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
