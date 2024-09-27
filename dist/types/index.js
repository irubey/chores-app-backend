// Enums
/**
 * Defines the OAuth providers supported for authentication.
 */
export var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["GOOGLE"] = "GOOGLE";
    OAuthProvider["FACEBOOK"] = "FACEBOOK";
    OAuthProvider["APPLE"] = "APPLE";
})(OAuthProvider || (OAuthProvider = {}));
/**
 * Defines the roles a user can have within a household.
 */
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MEMBER"] = "MEMBER";
})(UserRole || (UserRole = {}));
/**
 * Defines the possible statuses of a household.
 */
export var HouseholdStatus;
(function (HouseholdStatus) {
    HouseholdStatus["ACTIVE"] = "ACTIVE";
    HouseholdStatus["INACTIVE"] = "INACTIVE";
})(HouseholdStatus || (HouseholdStatus = {}));
/**
 * Defines the frequency options for recurring chores.
 */
export var ChoreFrequency;
(function (ChoreFrequency) {
    ChoreFrequency["DAILY"] = "DAILY";
    ChoreFrequency["WEEKLY"] = "WEEKLY";
    ChoreFrequency["MONTHLY"] = "MONTHLY";
    ChoreFrequency["CUSTOM"] = "CUSTOM";
})(ChoreFrequency || (ChoreFrequency = {}));
/**
 * Defines the priority levels for chores.
 */
export var ChorePriority;
(function (ChorePriority) {
    ChorePriority["LOW"] = "LOW";
    ChorePriority["MEDIUM"] = "MEDIUM";
    ChorePriority["HIGH"] = "HIGH";
})(ChorePriority || (ChorePriority = {}));
/**
 * Defines the types of transactions for shared funds.
 */
export var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionType || (TransactionType = {}));
/**
 * Defines the possible statuses of an invitation.
 */
export var InvitationStatus;
(function (InvitationStatus) {
    InvitationStatus["PENDING"] = "PENDING";
    InvitationStatus["ACCEPTED"] = "ACCEPTED";
    InvitationStatus["DECLINED"] = "DECLINED";
    InvitationStatus["EXPIRED"] = "EXPIRED";
})(InvitationStatus || (InvitationStatus = {}));
// Prisma Models and enums Export
export { HouseholdRole, ChoreStatus, SubtaskStatus, TransactionStatus, NotificationType, Provider, } from '@prisma/client';
