import { Response, NextFunction } from "express";
import * as threadService from "../services/threadService";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { CreateThreadDTO, UpdateThreadDTO } from "@shared/types";
import { AuthenticatedRequest } from "../types";

/**
 * ThreadController handles all CRUD operations related to threads.
 */
export class ThreadController {
  /**
   * Retrieves all threads for a specific household.
   */
  static async getThreads(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }
      const householdId = req.params.householdId;
      const threads = await threadService.getThreads(householdId, req.user.id);
      res.status(200).json(threads);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a new thread within a household.
   */
  static async createThread(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }
      const householdId = req.params.householdId;
      const threadData: CreateThreadDTO = {
        ...req.body,
        householdId,
      };
      const thread = await threadService.createThread(threadData, req.user.id);
      res.status(201).json(thread);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves details of a specific thread.
   */
  static async getThreadDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }
      const { householdId, threadId } = req.params;
      const thread = await threadService.getThreadById(
        householdId,
        threadId,
        req.user.id
      );
      if (!thread) {
        throw new NotFoundError("Thread not found");
      }
      res.status(200).json(thread);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing thread.
   */
  static async updateThread(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }
      const { householdId, threadId } = req.params;
      const updateData: UpdateThreadDTO = req.body;
      const updatedThread = await threadService.updateThread(
        householdId,
        threadId,
        updateData,
        req.user.id
      );
      if (!updatedThread) {
        throw new NotFoundError(
          "Thread not found or you do not have permission to update it"
        );
      }
      res.status(200).json(updatedThread);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a thread from a household.
   */
  static async deleteThread(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }
      const { householdId, threadId } = req.params;
      await threadService.deleteThread(householdId, threadId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invites users to a thread.
   */
  static async inviteUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthorized");
      }
      const { householdId, threadId } = req.params;
      const { userIds } = req.body; // Assuming an array of user IDs to invite
      const updatedThread = await threadService.inviteUsersToThread(
        householdId,
        threadId,
        userIds,
        req.user.id
      );
      res.status(200).json(updatedThread);
    } catch (error) {
      next(error);
    }
  }
}
