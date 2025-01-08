"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHousehold = createHousehold;
exports.getMembers = getMembers;
exports.getHouseholdById = getHouseholdById;
exports.updateHousehold = updateHousehold;
exports.deleteHousehold = deleteHousehold;
exports.addMember = addMember;
exports.removeMember = removeMember;
exports.acceptOrRejectInvitation = acceptOrRejectInvitation;
exports.getHouseholdsByUserId = getHouseholdsByUserId;
exports.getPendingInvitations = getPendingInvitations;
exports.sendInvitationEmail = sendInvitationEmail;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
const enums_1 = require("../../node_modules/@irubey/chores-app-shared/dist/enums");
const authService_1 = require("./authService");
const householdTransformer_1 = require("../utils/transformers/householdTransformer");
const logger_1 = __importDefault(require("../utils/logger"));
const sockets_1 = require("../sockets");
const servicesUtils_1 = require("../utils/servicesUtils");
const emailUtils_1 = require("../utils/emailUtils");
const userSelect = {
    id: true,
    email: true,
    name: true,
    profileImageURL: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    activeHouseholdId: true,
};
const householdInclude = {
    members: {
        include: {
            user: {
                select: userSelect,
            },
        },
    },
    threads: true,
    chores: true,
    expenses: true,
    events: true,
    choreTemplates: true,
    notificationSettings: true,
};
// Socket event names
const SOCKET_EVENTS = {
    HOUSEHOLD_UPDATE: 'household_update',
    HOUSEHOLD_DELETED: 'household_deleted',
    MEMBER_REMOVED: 'member_removed',
    INVITATION_ACCEPTED: 'invitation_accepted',
    INVITATION_REJECTED: 'invitation_rejected',
    HOUSEHOLD_INVITATION: 'household_invitation',
};
// Error messages
const ERROR_MESSAGES = {
    HOUSEHOLD_NOT_FOUND: 'Household not found',
    MEMBER_NOT_FOUND: 'Member not found',
    USER_NOT_FOUND: 'User not found',
    INVITER_NOT_FOUND: 'Inviting user not found',
    ALREADY_MEMBER: 'User is already a member of this household',
    INVALID_INVITATION: 'Invalid invitation status',
};
/**
 * Creates a new household and adds the creator as an ADMIN member.
 * @param data - The household data.
 * @param userId - The ID of the user creating the household.
 * @returns The created household with members.
 */
async function createHousehold(data, userId) {
    logger_1.default.debug('Creating new household', { data, userId });
    try {
        const household = await database_1.default.household.create({
            data: {
                name: data.name,
                currency: data.currency,
                timezone: data.timezone,
                language: data.language,
                members: {
                    create: {
                        userId,
                        role: enums_1.HouseholdRole.ADMIN,
                        isInvited: false,
                        isAccepted: true,
                        isRejected: false,
                        joinedAt: new Date(),
                    },
                },
            },
            include: householdInclude,
        });
        // Set this as the user's active household
        await database_1.default.user.update({
            where: { id: userId },
            data: { activeHouseholdId: household.id },
        });
        logger_1.default.info('Successfully created household', {
            householdId: household.id,
            userId,
        });
        return (0, servicesUtils_1.wrapResponse)((0, householdTransformer_1.transformHouseholdWithMembers)(household));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'create household');
    }
}
/**
 * Retrieves all members of a household.
 * @param householdId - The ID of the household.
 * @returns An array of household members.
 */
async function getMembers(householdId, userId) {
    logger_1.default.debug('Getting household members', { householdId, userId });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const members = await database_1.default.householdMember.findMany({
            where: { householdId },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
        logger_1.default.info('Successfully retrieved household members', {
            householdId,
            memberCount: members.length,
        });
        return (0, servicesUtils_1.wrapResponse)(members.map((member) => (0, householdTransformer_1.transformHouseholdMember)(member)));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'get household members');
    }
}
/**
 * Retrieves a household by its ID if the user is a member.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @param includeMembers - Whether to include household members in the response.
 * @returns The household details.
 * @throws NotFoundError if the household does not exist or the user is not a member.
 */
async function getHouseholdById(householdId, userId, includeMembers = false) {
    logger_1.default.debug('Getting household by ID', {
        householdId,
        userId,
        includeMembers,
    });
    try {
        const household = await database_1.default.household.findUnique({
            where: { id: householdId },
            include: householdInclude,
        });
        if (!household) {
            logger_1.default.warn('Household not found', { householdId });
            throw new errorHandler_1.NotFoundError('Household not found');
        }
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        logger_1.default.info('Successfully retrieved household', { householdId, userId });
        return (0, servicesUtils_1.wrapResponse)((0, householdTransformer_1.transformHouseholdWithMembers)(household));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'get household by ID');
    }
}
/**
 * Updates a household's details.
 * @param householdId - The ID of the household to update.
 * @param data - The updated household data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated household.
 * @throws NotFoundError if the household does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 */
async function updateHousehold(householdId, data, userId) {
    logger_1.default.debug('Updating household', { householdId, data, userId });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
        const household = await database_1.default.household.update({
            where: { id: householdId },
            data: {
                name: data.name,
                currency: data.currency,
                timezone: data.timezone,
                language: data.language,
            },
            include: householdInclude,
        });
        const transformedHousehold = (0, householdTransformer_1.transformHouseholdWithMembers)(household);
        logger_1.default.info('Successfully updated household', {
            householdId,
            userId,
        });
        (0, servicesUtils_1.emitHouseholdEvent)(SOCKET_EVENTS.HOUSEHOLD_UPDATE, householdId, {
            household: transformedHousehold,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedHousehold);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'update household');
    }
}
/**
 * Deletes a household and its related data.
 * @param householdId - The ID of the household to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws NotFoundError if the household does not exist.
 * @throws UnauthorizedError if the user is not an ADMIN.
 */
async function deleteHousehold(householdId, userId) {
    logger_1.default.debug('Deleting household', { householdId, userId });
    try {
        await (0, authService_1.verifyMembership)(householdId, userId, [enums_1.HouseholdRole.ADMIN]);
        // Clear activeHouseholdId for all users who had this as their active household
        await database_1.default.user.updateMany({
            where: { activeHouseholdId: householdId },
            data: { activeHouseholdId: null },
        });
        const household = await database_1.default.household.delete({
            where: { id: householdId },
            include: householdInclude,
        });
        logger_1.default.info('Successfully deleted household', { householdId, userId });
        const transformedHousehold = (0, householdTransformer_1.transformHouseholdWithMembers)(household);
        (0, servicesUtils_1.emitHouseholdEvent)('household_deleted', householdId, {
            household: transformedHousehold,
        });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'delete household');
    }
}
/**
 * Adds a new member to a household.
 */
async function addMember(householdId, data, requestingUserId) {
    logger_1.default.debug('Adding member to household', {
        householdId,
        email: data.email,
        requestingUserId,
    });
    try {
        await (0, authService_1.verifyMembership)(householdId, requestingUserId, [
            enums_1.HouseholdRole.ADMIN,
        ]);
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
            select: userSelect,
        });
        if (!user) {
            logger_1.default.warn('User not found when adding member', {
                email: data.email,
                householdId,
            });
            throw new errorHandler_1.NotFoundError('User not found');
        }
        const existingMember = await database_1.default.householdMember.findUnique({
            where: {
                userId_householdId: {
                    householdId,
                    userId: user.id,
                },
            },
        });
        if (existingMember) {
            logger_1.default.warn('User is already a member', {
                userId: user.id,
                householdId,
            });
            throw new errorHandler_1.BadRequestError('User is already a member of this household');
        }
        const member = await database_1.default.householdMember.create({
            data: {
                userId: user.id,
                householdId,
                role: data.role || enums_1.HouseholdRole.MEMBER,
                isInvited: true,
                isAccepted: false,
                isRejected: false,
                joinedAt: new Date(),
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
        logger_1.default.info('Successfully added member to household', {
            householdId,
            newUserId: user.id,
            requestingUserId,
        });
        const transformedMember = (0, householdTransformer_1.transformHouseholdMember)(member);
        (0, servicesUtils_1.emitUserEvent)('household_invitation', user.id, {
            member: transformedMember,
        });
        return (0, servicesUtils_1.wrapResponse)(transformedMember);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'add member to household');
    }
}
/**
 * Removes a member from a household.
 */
async function removeMember(householdId, memberId, requestingUserId) {
    logger_1.default.debug('Removing member from household', {
        householdId,
        memberId,
        requestingUserId,
    });
    try {
        await (0, authService_1.verifyMembership)(householdId, requestingUserId, [
            enums_1.HouseholdRole.ADMIN,
        ]);
        const member = await database_1.default.householdMember.findUnique({
            where: { id: memberId },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
        if (!member) {
            throw new errorHandler_1.NotFoundError(ERROR_MESSAGES.MEMBER_NOT_FOUND);
        }
        // If this was the user's active household, clear it
        if (member.user?.activeHouseholdId === householdId) {
            await database_1.default.user.update({
                where: { id: member.user.id },
                data: { activeHouseholdId: null },
            });
        }
        await database_1.default.householdMember.delete({
            where: { id: memberId },
        });
        logger_1.default.info('Successfully removed member from household', {
            householdId,
            memberId,
            requestingUserId,
        });
        (0, sockets_1.getIO)()
            .to(`household_${householdId}`)
            .emit(SOCKET_EVENTS.MEMBER_REMOVED, { userId: member.user?.id });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'remove member from household');
    }
}
/**
 * Updates the status of a household member (e.g., accept/reject invitation).
 */
async function acceptOrRejectInvitation(householdId, userId, accept) {
    logger_1.default.debug('Processing invitation response', {
        householdId,
        userId,
        accept,
    });
    try {
        const member = await database_1.default.householdMember.findUnique({
            where: {
                userId_householdId: {
                    householdId,
                    userId,
                },
            },
            include: {
                user: {
                    select: userSelect,
                },
            },
        });
        if (!member) {
            logger_1.default.warn('Member not found for invitation response', {
                householdId,
                userId,
            });
            throw new errorHandler_1.NotFoundError('Member not found in the household');
        }
        if (!member.isInvited || member.isAccepted || member.isRejected) {
            logger_1.default.warn('Invalid invitation status', {
                householdId,
                userId,
                currentStatus: {
                    isInvited: member.isInvited,
                    isAccepted: member.isAccepted,
                    isRejected: member.isRejected,
                },
            });
            throw new errorHandler_1.BadRequestError('Invalid invitation status');
        }
        const updatedMember = await database_1.default.householdMember.update({
            where: {
                userId_householdId: {
                    householdId,
                    userId,
                },
            },
            data: {
                isInvited: false,
                isAccepted: accept,
                isRejected: !accept,
                joinedAt: accept ? new Date() : member.joinedAt,
                leftAt: !accept ? new Date() : null,
                role: accept ? enums_1.HouseholdRole.MEMBER : member.role,
            },
            include: {
                user: {
                    select: userSelect,
                },
                household: {
                    include: householdInclude,
                },
            },
        });
        // If accepted, set as active household if user doesn't have one
        if (accept) {
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                select: { activeHouseholdId: true },
            });
            if (!user?.activeHouseholdId) {
                await database_1.default.user.update({
                    where: { id: userId },
                    data: { activeHouseholdId: householdId },
                });
            }
        }
        logger_1.default.info('Successfully processed invitation response', {
            householdId,
            userId,
            accepted: accept,
        });
        const transformedMember = {
            ...(0, householdTransformer_1.transformHouseholdMember)(updatedMember),
            household: updatedMember.household
                ? (0, householdTransformer_1.transformHouseholdWithMembers)(updatedMember.household)
                : undefined,
        };
        const eventName = accept ? 'invitation_accepted' : 'invitation_rejected';
        (0, sockets_1.getIO)()
            .to(`household_${householdId}`)
            .emit(eventName, { member: transformedMember });
        return (0, servicesUtils_1.wrapResponse)(transformedMember);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'process invitation response');
    }
}
/**
 * Retrieves all households for a user.
 */
async function getHouseholdsByUserId(userId) {
    logger_1.default.debug('Getting households for user', { userId });
    try {
        const members = await database_1.default.householdMember.findMany({
            where: {
                userId,
                isAccepted: true,
                isRejected: false,
            },
            include: {
                household: {
                    include: householdInclude,
                },
            },
        });
        logger_1.default.info('Successfully retrieved user\'s households', {
            userId,
            count: members.length,
        });
        return (0, servicesUtils_1.wrapResponse)(members
            .filter((member) => member.household)
            .map((member) => (0, householdTransformer_1.transformHouseholdWithMembers)(member.household)));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'get user\'s households');
    }
}
/**
 * Retrieves all pending invitations for a user.
 */
async function getPendingInvitations(userId) {
    logger_1.default.debug('Getting pending invitations for user', { userId });
    try {
        const members = await database_1.default.householdMember.findMany({
            where: {
                userId,
                isInvited: true,
                isAccepted: false,
                isRejected: false,
            },
            include: {
                user: {
                    select: userSelect,
                },
                household: {
                    include: householdInclude,
                },
            },
        });
        logger_1.default.info('Successfully retrieved pending invitations', {
            userId,
            count: members.length,
        });
        return (0, servicesUtils_1.wrapResponse)(members.map((member) => ({
            ...(0, householdTransformer_1.transformHouseholdMember)(member),
            household: member.household
                ? (0, householdTransformer_1.transformHouseholdWithMembers)(member.household)
                : undefined,
        })));
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'get pending invitations');
    }
}
/**
 * Sends an invitation email to a user.
 */
async function sendInvitationEmail(householdId, email, requestingUserId) {
    logger_1.default.debug('Sending invitation email', {
        householdId,
        email,
        requestingUserId,
    });
    try {
        await (0, authService_1.verifyMembership)(householdId, requestingUserId, [
            enums_1.HouseholdRole.ADMIN,
        ]);
        const household = await database_1.default.household.findUnique({
            where: { id: householdId },
            include: {
                members: {
                    where: { userId: requestingUserId },
                    include: {
                        user: {
                            select: userSelect,
                        },
                    },
                },
            },
        });
        if (!household) {
            throw new errorHandler_1.NotFoundError('Household not found');
        }
        const inviter = household.members[0]?.user;
        if (!inviter) {
            throw new errorHandler_1.NotFoundError('Inviting user not found');
        }
        const token = (0, emailUtils_1.generateInviteToken)();
        const emailTemplate = (0, emailUtils_1.generateInvitationEmailTemplate)(household.name, inviter.name || inviter.email, `${process.env.FRONTEND_URL}/invite?token=${token}`);
        await (0, emailUtils_1.sendEmail)({
            to: email,
            subject: `Invitation to join ${household.name}`,
            html: emailTemplate,
        });
        logger_1.default.info('Successfully sent invitation email', {
            householdId,
            email,
            requestingUserId,
        });
        return (0, servicesUtils_1.wrapResponse)(undefined);
    }
    catch (error) {
        return (0, servicesUtils_1.handleServiceError)(error, 'send invitation email');
    }
}
exports.default = {
    createHousehold,
    getHouseholdById,
    updateHousehold,
    deleteHousehold,
    getMembers,
    addMember,
    removeMember,
    acceptOrRejectInvitation,
    getHouseholdsByUserId,
    getPendingInvitations,
    sendInvitationEmail,
};
