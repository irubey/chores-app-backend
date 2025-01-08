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
exports.ChoreEventController = void 0;
const choreEventService = __importStar(require("../services/choreEventService"));
/**
 * ChoreEventController handles all CRUD operations related to chore events.
 */
class ChoreEventController {
    /**
     * Retrieves all events linked to a specific chore.
     */
    static async getChoreEvents(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            if (!householdId || !choreId) {
                throw new Error("Household ID and Chore ID are required");
            }
            const response = await choreEventService.getChoreEvents(householdId, choreId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new event associated with a chore.
     */
    static async createChoreEvent(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            if (!householdId || !choreId) {
                throw new Error("Household ID and Chore ID are required");
            }
            const choreEventData = req.body;
            const response = await choreEventService.createChoreEvent(householdId, choreId, choreEventData, req.user.id);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific chore event.
     */
    static async getChoreEventById(req, res, next) {
        try {
            const { householdId, choreId, eventId } = req.params;
            if (!householdId || !choreId || !eventId) {
                throw new Error("Household ID, Chore ID, and Event ID are required");
            }
            const response = await choreEventService.getChoreEventById(householdId, choreId, eventId, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing chore-linked event.
     */
    static async updateChoreEvent(req, res, next) {
        try {
            const { householdId, choreId, eventId } = req.params;
            if (!householdId || !choreId || !eventId) {
                throw new Error("Household ID, Chore ID, and Event ID are required");
            }
            const updateData = req.body;
            const response = await choreEventService.updateChoreEvent(householdId, choreId, eventId, updateData, req.user.id);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a chore-linked event.
     */
    static async deleteChoreEvent(req, res, next) {
        try {
            const { householdId, choreId, eventId } = req.params;
            if (!householdId || !choreId || !eventId) {
                throw new Error("Household ID, Chore ID, and Event ID are required");
            }
            await choreEventService.deleteChoreEvent(householdId, choreId, eventId, req.user.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates the status of a chore event.
     */
    static async updateChoreEventStatus(req, res, next) {
        try {
            const { householdId, choreId, eventId } = req.params;
            if (!householdId || !choreId || !eventId) {
                throw new Error("Household ID, Chore ID, and Event ID are required");
            }
            const { status } = req.body;
            const response = await choreEventService.updateChoreEventStatus(householdId, choreId, eventId, req.user.id, status);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reschedules a chore event.
     */
    static async rescheduleChoreEvent(req, res, next) {
        try {
            const { householdId, choreId, eventId } = req.params;
            if (!householdId || !choreId || !eventId) {
                throw new Error("Household ID, Chore ID, and Event ID are required");
            }
            const { newStartTime, newEndTime } = req.body;
            const response = await choreEventService.rescheduleChoreEvent(householdId, choreId, eventId, req.user.id, new Date(newStartTime), new Date(newEndTime));
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves upcoming chore events.
     */
    static async getUpcomingChoreEvents(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            if (!householdId || !choreId) {
                throw new Error("Household ID and Chore ID are required");
            }
            const { limit } = req.query;
            const response = await choreEventService.getUpcomingChoreEvents(householdId, choreId, req.user.id, limit ? parseInt(limit, 10) : undefined);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChoreEventController = ChoreEventController;
