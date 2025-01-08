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
exports.SubtaskController = void 0;
const subtaskService = __importStar(require("../services/subtaskService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * SubtaskController handles all CRUD operations related to subtasks.
 */
class SubtaskController {
    /**
     * Adds a new subtask to a specific chore.
     */
    static async addSubtask(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            const subtaskData = req.body;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await subtaskService.addSubtask(householdId, choreId, subtaskData, userId);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing subtask.
     */
    static async updateSubtask(req, res, next) {
        try {
            const { householdId, choreId, subtaskId } = req.params;
            const subtaskData = req.body;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId || !subtaskId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await subtaskService.updateSubtask(householdId, choreId, subtaskId, subtaskData, userId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Gets all subtasks for a specific chore.
     */
    static async getSubtasks(req, res, next) {
        try {
            const { householdId, choreId } = req.params;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            const response = await subtaskService.getSubtasks(householdId, choreId, userId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a subtask from a specific chore.
     */
    static async deleteSubtask(req, res, next) {
        try {
            const { householdId, choreId, subtaskId } = req.params;
            const userId = req.user?.id;
            if (!userId || !householdId || !choreId || !subtaskId) {
                throw new errorHandler_1.UnauthorizedError("Missing required parameters");
            }
            await subtaskService.deleteSubtask(householdId, choreId, subtaskId, userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SubtaskController = SubtaskController;
