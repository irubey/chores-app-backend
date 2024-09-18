"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.householdService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const emailUtils_1 = require("../utils/emailUtils");
const tokenUtils_1 = require("../utils/tokenUtils");
const prisma = new client_1.PrismaClient();
exports.householdService = {
    createHousehold(name, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield prisma.household.create({
                data: {
                    name,
                    members: {
                        create: {
                            userId,
                            role: 'ADMIN',
                        },
                    },
                },
                include: {
                    members: true,
                },
            });
            return household;
        });
    },
    getHousehold(householdId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield prisma.household.findUnique({
                where: { id: householdId },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profilePictureUrl: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!household) {
                throw new errors_1.NotFoundError('Household not found');
            }
            const isMember = household.members.some(member => member.userId === userId);
            if (!isMember) {
                throw new errors_1.UnauthorizedError('User is not a member of this household');
            }
            return household;
        });
    },
    updateHousehold(householdId, userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield this.getHousehold(householdId, userId);
            const isAdmin = household.members.some(member => member.userId === userId && member.role === 'ADMIN');
            if (!isAdmin) {
                throw new errors_1.UnauthorizedError('Only admins can update the household');
            }
            const updatedHousehold = yield prisma.household.update({
                where: { id: householdId },
                data,
            });
            return updatedHousehold;
        });
    },
    deleteHousehold(householdId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield this.getHousehold(householdId, userId);
            const isAdmin = household.members.some(member => member.userId === userId && member.role === 'ADMIN');
            if (!isAdmin) {
                throw new errors_1.UnauthorizedError('Only admins can delete the household');
            }
            yield prisma.household.delete({
                where: { id: householdId },
            });
        });
    },
    inviteUser(householdId, inviterId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield this.getHousehold(householdId, inviterId);
            const isAdmin = household.members.some(member => member.userId === inviterId && member.role === 'ADMIN');
            if (!isAdmin) {
                throw new errors_1.UnauthorizedError('Only admins can invite users');
            }
            const token = (0, tokenUtils_1.generateInvitationToken)();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            const invitation = yield prisma.householdInvitation.create({
                data: {
                    householdId,
                    invitedById: inviterId,
                    email,
                    token,
                    expiresAt,
                },
            });
            yield (0, emailUtils_1.sendInvitationEmail)(email, invitation.token, household.name);
            return invitation;
        });
    },
    acceptInvitation(token, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const invitation = yield prisma.householdInvitation.findUnique({
                where: { token },
                include: { household: true },
            });
            if (!invitation || invitation.expiresAt < new Date()) {
                throw new errors_1.NotFoundError('Invalid or expired invitation');
            }
            const newMember = yield prisma.householdMember.create({
                data: {
                    householdId: invitation.householdId,
                    userId,
                    role: 'MEMBER',
                },
                include: {
                    household: true,
                    user: true,
                },
            });
            yield prisma.householdInvitation.delete({
                where: { id: invitation.id },
            });
            return newMember;
        });
    },
    removeMember(householdId, adminId, memberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield this.getHousehold(householdId, adminId);
            const isAdmin = household.members.some(member => member.userId === adminId && member.role === 'ADMIN');
            if (!isAdmin) {
                throw new errors_1.UnauthorizedError('Only admins can remove members');
            }
            if (adminId === memberId) {
                throw new errors_1.UnauthorizedError('Admins cannot remove themselves');
            }
            yield prisma.householdMember.delete({
                where: {
                    userId_householdId: {
                        userId: memberId,
                        householdId,
                    },
                },
            });
        });
    },
    getHouseholdMembers(householdId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield this.getHousehold(householdId, userId);
            return household.members;
        });
    },
    updateMemberRole(householdId, adminId, memberId, newRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield this.getHousehold(householdId, adminId);
            const isAdmin = household.members.some(member => member.userId === adminId && member.role === 'ADMIN');
            if (!isAdmin) {
                throw new errors_1.UnauthorizedError('Only admins can update member roles');
            }
            const updatedMember = yield prisma.householdMember.update({
                where: {
                    userId_householdId: {
                        userId: memberId,
                        householdId,
                    },
                },
                data: {
                    role: newRole,
                },
                include: {
                    user: true,
                },
            });
            return updatedMember;
        });
    },
};
exports.default = exports.householdService;
