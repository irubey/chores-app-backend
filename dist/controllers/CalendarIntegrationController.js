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
exports.CalendarIntegrationController = void 0;
const calendarIntegrationService = __importStar(require("../services/calendarIntegrationService"));
/**
 * CalendarIntegrationController handles all operations related to calendar synchronization.
 */
class CalendarIntegrationController {
    /**
     * Syncs the household calendar with the user's personal calendar.
     */
    static async syncWithPersonalCalendar(req, res, next) {
        try {
            const { householdId } = req.params;
            const { accessToken } = req.body; // Assuming accessToken is provided in the request body
            if (!accessToken || !householdId) {
                throw new Error("Access token and Household ID are required for synchronization.");
            }
            const syncResult = await calendarIntegrationService.syncWithPersonalCalendar(householdId, req.user.id, accessToken);
            res.status(200).json({ data: syncResult });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CalendarIntegrationController = CalendarIntegrationController;
