"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.NotificationType = exports.TransactionStatus = exports.SubtaskStatus = exports.ChoreStatus = exports.HouseholdRole = exports.InvitationStatus = exports.TransactionType = exports.ChorePriority = exports.ChoreFrequency = exports.HouseholdStatus = exports.UserRole = exports.OAuthProvider = void 0;
// Enums
/**
 * Defines the OAuth providers supported for authentication.
 */
var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["GOOGLE"] = "GOOGLE";
    OAuthProvider["FACEBOOK"] = "FACEBOOK";
    OAuthProvider["APPLE"] = "APPLE";
})(OAuthProvider || (exports.OAuthProvider = OAuthProvider = {}));
/**
 * Defines the roles a user can have within a household.
 */
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MEMBER"] = "MEMBER";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * Defines the possible statuses of a household.
 */
var HouseholdStatus;
(function (HouseholdStatus) {
    HouseholdStatus["ACTIVE"] = "ACTIVE";
    HouseholdStatus["INACTIVE"] = "INACTIVE";
})(HouseholdStatus || (exports.HouseholdStatus = HouseholdStatus = {}));
/**
 * Defines the frequency options for recurring chores.
 */
var ChoreFrequency;
(function (ChoreFrequency) {
    ChoreFrequency["DAILY"] = "DAILY";
    ChoreFrequency["WEEKLY"] = "WEEKLY";
    ChoreFrequency["MONTHLY"] = "MONTHLY";
    ChoreFrequency["CUSTOM"] = "CUSTOM";
})(ChoreFrequency || (exports.ChoreFrequency = ChoreFrequency = {}));
/**
 * Defines the priority levels for chores.
 */
var ChorePriority;
(function (ChorePriority) {
    ChorePriority["LOW"] = "LOW";
    ChorePriority["MEDIUM"] = "MEDIUM";
    ChorePriority["HIGH"] = "HIGH";
})(ChorePriority || (exports.ChorePriority = ChorePriority = {}));
/**
 * Defines the types of transactions for shared funds.
 */
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
/**
 * Defines the possible statuses of an invitation.
 */
var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
    InvitationStatus["DECLINED"] = "DECLINED";
    InvitationStatus["EXPIRED"] = "EXPIRED";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
// Prisma Models Export
var client_1 = require("@prisma/client");
Object.defineProperty(exports, "HouseholdRole", { enumerable: true, get: function () { return client_1.HouseholdRole; } });
Object.defineProperty(exports, "ChoreStatus", { enumerable: true, get: function () { return client_1.ChoreStatus; } });
Object.defineProperty(exports, "SubtaskStatus", { enumerable: true, get: function () { return client_1.SubtaskStatus; } });
Object.defineProperty(exports, "TransactionStatus", { enumerable: true, get: function () { return client_1.TransactionStatus; } });
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return client_1.NotificationType; } });
Object.defineProperty(exports, "Provider", { enumerable: true, get: function () { return client_1.Provider; } });
