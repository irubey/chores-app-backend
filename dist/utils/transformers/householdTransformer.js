"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformHousehold = transformHousehold;
exports.transformMembership = transformMembership;
exports.transformHouseholdWithMembers = transformHouseholdWithMembers;
exports.transformHouseholdMember = transformHouseholdMember;
exports.transformCreateHouseholdDTO = transformCreateHouseholdDTO;
exports.transformUpdateHouseholdDTO = transformUpdateHouseholdDTO;
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const userTransformer_1 = require("./userTransformer");
function isValidHouseholdRole(role) {
    return Object.values(enums_1.HouseholdRole).includes(role);
}
/**
 * Transforms a Prisma Household into a shared Household type
 */
function transformHousehold(prismaHousehold) {
    const { id, name, createdAt, updatedAt, deletedAt, currency, icon, timezone, language, } = prismaHousehold;
    return {
        id,
        name,
        createdAt,
        updatedAt,
        deletedAt: deletedAt ?? undefined,
        currency,
        icon: icon ?? undefined,
        timezone,
        language,
    };
}
/**
 * Transforms a Prisma HouseholdMember into a shared HouseholdMember type
 */
function transformMembership(membership) {
    const sharedMembership = {
        id: membership.id,
        userId: membership.userId,
        householdId: membership.householdId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        leftAt: membership.leftAt ?? undefined,
        isInvited: membership.isInvited,
        isAccepted: membership.isAccepted,
        isRejected: membership.isRejected,
        nickname: membership.nickname ?? undefined,
    };
    return sharedMembership;
}
/**
 * Transforms a Prisma Household with members into a shared HouseholdWithMembers type
 */
function transformHouseholdWithMembers(prismaHousehold) {
    const household = transformHousehold(prismaHousehold);
    const members = prismaHousehold.members?.map((member) => transformHouseholdMember(member)) ?? [];
    return {
        ...household,
        members,
    };
}
function transformHouseholdMember(member) {
    if (!isValidHouseholdRole(member.role)) {
        throw new Error(`Invalid household role: ${member.role}`);
    }
    return {
        id: member.id,
        userId: member.userId,
        householdId: member.householdId,
        role: member.role,
        joinedAt: member.joinedAt,
        leftAt: member.leftAt ?? undefined,
        isInvited: member.isInvited,
        isAccepted: member.isAccepted,
        isRejected: member.isRejected,
        nickname: member.nickname ?? undefined,
        user: member.user ? (0, userTransformer_1.transformUser)(member.user) : undefined,
    };
}
function transformCreateHouseholdDTO(dto) {
    return {
        name: dto.name,
        currency: dto.currency,
        timezone: dto.timezone,
        language: dto.language,
        icon: null,
    };
}
function transformUpdateHouseholdDTO(dto) {
    const transformed = {};
    if (dto.name !== undefined)
        transformed.name = dto.name;
    if (dto.currency !== undefined)
        transformed.currency = dto.currency;
    if (dto.timezone !== undefined)
        transformed.timezone = dto.timezone;
    if (dto.language !== undefined)
        transformed.language = dto.language;
    return transformed;
}
