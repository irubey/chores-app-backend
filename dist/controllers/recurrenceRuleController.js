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
exports.RecurrenceRuleController = void 0;
const recurrenceRuleService = __importStar(require("../services/recurrenceRuleService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * RecurrenceRuleController handles all CRUD operations related to recurrence rules.
 */
class RecurrenceRuleController {
    /**
     * Lists all recurrence rules.
     */
    static async listRecurrenceRules(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const response = await recurrenceRuleService.listRecurrenceRules();
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Creates a new recurrence rule.
     */
    static async createRecurrenceRule(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const response = await recurrenceRuleService.createRecurrenceRule(req.body);
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves a recurrence rule by ID.
     */
    static async getRecurrenceRule(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { ruleId } = req.params;
            if (!ruleId) {
                throw new Error("Missing required parameter: ruleId");
            }
            const response = await recurrenceRuleService.getRecurrenceRule(ruleId);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing recurrence rule.
     */
    static async updateRecurrenceRule(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { ruleId } = req.params;
            if (!ruleId) {
                throw new Error("Missing required parameter: ruleId");
            }
            const response = await recurrenceRuleService.updateRecurrenceRule(ruleId, req.body);
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a recurrence rule.
     */
    static async deleteRecurrenceRule(req, res, next) {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError("User not authenticated");
            }
            const { ruleId } = req.params;
            if (!ruleId) {
                throw new Error("Missing required parameter: ruleId");
            }
            await recurrenceRuleService.deleteRecurrenceRule(ruleId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RecurrenceRuleController = RecurrenceRuleController;
