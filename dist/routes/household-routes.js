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
const express_1 = require("express");
const householdController = __importStar(require("../controllers/householdController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(authMiddleware_1.authMiddleware);
// User-specific routes (must be before parameterized routes)
router.get("/user/households", (0, asyncHandler_1.asyncHandler)(householdController.getUserHouseholds));
router.get("/user/invitations", (0, asyncHandler_1.asyncHandler)(householdController.getPendingInvitations));
// Household management
router.post("/", (0, validationMiddleware_1.validate)(validationSchemas_1.createHouseholdSchema), (0, asyncHandler_1.asyncHandler)(householdController.createHousehold));
router.get("/:householdId", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(householdController.getHouseholdById));
router.patch("/:householdId", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, validationMiddleware_1.validate)(validationSchemas_1.updateHouseholdSchema), (0, asyncHandler_1.asyncHandler)(householdController.updateHousehold));
router.delete("/:householdId", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(householdController.deleteHousehold));
// Member management
router.get("/:householdId/members", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN, enums_1.HouseholdRole.MEMBER]), (0, asyncHandler_1.asyncHandler)(householdController.getMembers));
router.post("/:householdId/members", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, validationMiddleware_1.validate)(validationSchemas_1.addMemberSchema), (0, asyncHandler_1.asyncHandler)(householdController.addMember));
router.delete("/:householdId/members/:memberId", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, asyncHandler_1.asyncHandler)(householdController.removeMember));
// Invitation management
router.post("/:householdId/invitations/send", (0, rbacMiddleware_1.rbacMiddleware)([enums_1.HouseholdRole.ADMIN]), (0, validationMiddleware_1.validate)(validationSchemas_1.emailSchema), (0, asyncHandler_1.asyncHandler)(householdController.sendInvitationEmail));
router.post("/:householdId/invitations/accept", (0, asyncHandler_1.asyncHandler)(householdController.acceptInvitation));
router.post("/:householdId/invitations/reject", (0, asyncHandler_1.asyncHandler)(householdController.rejectInvitation));
exports.default = router;
