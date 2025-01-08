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
exports.ChoreController = void 0;
const choreService = __importStar(require("../services/choreService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * ChoreController handles all CRUD operations related to chores.
 */
class ChoreController {
    /**
     * Retrieves all chores for a specific household.
     */
    static async getChores(req, res, next) {
        try {
            const { householdId } = req.params;
            const userId = req.user?.id;
            if (!userId || !householdId) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated or invalid household");
            }
            const response = await choreService.getChores(householdId, userId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new chore.
     */
    static async createChore(req, res, next) {
        try {
            const { householdId } = req.params;
            const choreData = req.body;
            const userId = req.user?.id;
            if (!userId || !householdId) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated or invalid household");
            }
            const response = await choreService.createChore(householdId, choreData, userId);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific chore.
     */
    static async getChoreDetails(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await choreService.getChoreById(householdId, choreId, userId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing chore.
     */
    static async updateChore(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await choreService.updateChore(householdId, choreId, updateData, userId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a chore.
     */
    static async deleteChore(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            await choreService.deleteChore(householdId, choreId, userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a chore swap request.
     */
    static async createChoreSwapRequest(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            const { targetUserId } = req.body;
            const requestingUserId = req.user?.id;
            if (!requestingUserId || !householdId || !choreId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await choreService.createChoreSwapRequest(householdId, { choreId, targetUserId }, requestingUserId);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Approves or rejects a chore swap request.
     */
    static async approveOrRejectChoreSwap(req, res, next) {
        try {
            const { householdId, choreId, swapRequestId } = req.params;
            const { approved } = req.body;
            const approvingUserId = req.user?.id;
            if (!approvingUserId || !householdId || !choreId || !swapRequestId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await choreService.approveOrRejectChoreSwap(householdId, choreId, swapRequestId, approved, approvingUserId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChoreController = ChoreController;
