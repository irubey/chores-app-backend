"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadController = void 0;
const threadService = __importStar(require("../services/threadService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * ThreadController handles all CRUD operations related to threads.
 */
class ThreadController {
    /**
     * Retrieves all threads for a specific household.
     */
    static async getThreads(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId } = req.params;
            const { limit, cursor, direction, sortBy } = req.query;
            if (!householdId) {
                throw new Error("Missing required parameters: householdId");
            }
            // Validate pagination parameters
            const paginationOptions = {
                limit: limit ? Math.min(Math.max(parseInt(limit), 1), 100) : 20, // Limit between 1 and 100
                cursor: cursor,
                direction: direction === "asc" ? "asc" : "desc", // Default to desc if invalid
                sortBy: ["updatedAt", "createdAt"].includes(sortBy || "")
                    ? sortBy
                    : "updatedAt", // Validate sortBy field
            };
            const response = await threadService.getThreads(householdId, req.user.id, paginationOptions);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new thread within a household.
     */
    static async createThread(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId } = req.params;
            if (!householdId) {
                throw new Error("Missing required parameters: householdId");
            }
            const threadData = {
                ...req.body,
                householdId,
                authorId: req.user.id,
            };
            const response = await threadService.createThread(threadData, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific thread.
     */
    static async getThreadById(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, threadId } = req.params;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const response = await threadService.getThreadById(householdId, threadId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing thread.
     */
    static async updateThread(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, threadId } = req.params;
            const updateData = req.body;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const response = await threadService.updateThread(householdId, threadId, updateData, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a thread from a household.
     */
    static async deleteThread(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, threadId } = req.params;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            await threadService.deleteThread(householdId, threadId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Invites users to a thread.
     */
    static async inviteUsersToThread(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("Unauthorized");
            }
            const { householdId, threadId } = req.params;
            const { userIds } = req.body;
            if (!householdId || !threadId) {
                throw new Error("Missing required parameters: householdId and threadId");
            }
            const response = await threadService.inviteUsersToThread(householdId, threadId, { userIds }, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ThreadController = ThreadController;
