"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recurrenceRuleController_1 = require("../controllers/recurrenceRuleController");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
/**
 * @route   GET /api/recurrence-rules
 * @desc    List all recurrence rules
 * @access  Protected
 */
router.get("/", (0, asyncHandler_1.asyncHandler)(recurrenceRuleController_1.RecurrenceRuleController.listRecurrenceRules));
/**
 * @route   POST /api/recurrence-rules
 * @desc    Create a new recurrence rule
 * @access  Protected
 */
router.post("/", (0, validationMiddleware_1.validate)(validationSchemas_1.createRecurrenceRuleSchema), (0, asyncHandler_1.asyncHandler)(recurrenceRuleController_1.RecurrenceRuleController.createRecurrenceRule));
/**
 * @route   GET /api/recurrence-rules/:ruleId
 * @desc    Get a recurrence rule by ID
 * @access  Protected
 */
router.get("/:ruleId", (0, asyncHandler_1.asyncHandler)(recurrenceRuleController_1.RecurrenceRuleController.getRecurrenceRule));
/**
 * @route   PATCH /api/recurrence-rules/:ruleId
 * @desc    Update a recurrence rule
 * @access  Protected
 */
router.patch("/:ruleId", (0, asyncHandler_1.asyncHandler)(recurrenceRuleController_1.RecurrenceRuleController.updateRecurrenceRule));
/**
 * @route   DELETE /api/recurrence-rules/:ruleId
 * @desc    Delete a recurrence rule
 * @access  Protected
 */
router.delete("/:ruleId", (0, asyncHandler_1.asyncHandler)(recurrenceRuleController_1.RecurrenceRuleController.deleteRecurrenceRule));
exports.default = router;
