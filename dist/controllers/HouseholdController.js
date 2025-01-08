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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHousehold = createHousehold;
exports.getHouseholdById = getHouseholdById;
exports.updateHousehold = updateHousehold;
exports.deleteHousehold = deleteHousehold;
exports.getMembers = getMembers;
exports.addMember = addMember;
exports.removeMember = removeMember;
exports.acceptInvitation = acceptInvitation;
exports.rejectInvitation = rejectInvitation;
exports.getUserHouseholds = getUserHouseholds;
exports.getPendingInvitations = getPendingInvitations;
exports.sendInvitationEmail = sendInvitationEmail;
const logger_1 = __importDefault(require("../utils/logger"));
const householdService = __importStar(require("../services/householdService"));
const errorHandler_1 = require("../middlewares/errorHandler");
const ERROR_MESSAGES = {
    USER_ID_REQUIRED: 'User ID is required',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_HOUSEHOLD_DATA: 'Invalid household data',
    HOUSEHOLD_ID_REQUIRED: 'Household ID is required',
    MEMBER_ID_REQUIRED: 'Member ID is required',
};
async function createHousehold(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        const data = req.body;
        if (!data.name) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.INVALID_HOUSEHOLD_DATA);
        }
        logger_1.default.info('Creating household', { userId, data });
        const response = await householdService.createHousehold(data, userId);
        res.status(201).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to create household', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function getHouseholdById(req, res, next) {
    try {
        const { householdId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        logger_1.default.info('Getting household by ID', { householdId, userId });
        const response = await householdService.getHouseholdById(householdId, userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to get household by ID', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function updateHousehold(req, res, next) {
    try {
        const { householdId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        const data = req.body;
        logger_1.default.info('Updating household', { householdId, userId, data });
        const response = await householdService.updateHousehold(householdId, data, userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to update household', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function deleteHousehold(req, res, next) {
    try {
        const { householdId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        logger_1.default.info('Deleting household', { householdId, userId });
        const response = await householdService.deleteHousehold(householdId, userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to delete household', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function getMembers(req, res, next) {
    try {
        const { householdId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        logger_1.default.info('Getting household members', { householdId, userId });
        const response = await householdService.getMembers(householdId, userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to get household members', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function addMember(req, res, next) {
    try {
        const { householdId } = req.params;
        const { email } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.INVALID_EMAIL);
        }
        logger_1.default.info('Adding member to household', {
            householdId,
            email,
            userId,
        });
        const response = await householdService.addMember(householdId, { email }, userId);
        res.status(201).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to add member', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function removeMember(req, res, next) {
    try {
        const { householdId, memberId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        if (!memberId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.MEMBER_ID_REQUIRED);
        }
        logger_1.default.info('Removing member from household', {
            householdId,
            memberId,
            userId,
        });
        const response = await householdService.removeMember(householdId, memberId, userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to remove member', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            memberId: req.params.memberId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function acceptInvitation(req, res, next) {
    try {
        const { householdId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        logger_1.default.info('Accepting household invitation', { householdId, userId });
        const response = await householdService.acceptOrRejectInvitation(householdId, userId, true);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to accept invitation', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function rejectInvitation(req, res, next) {
    try {
        const { householdId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        logger_1.default.info('Rejecting household invitation', { householdId, userId });
        const response = await householdService.acceptOrRejectInvitation(householdId, userId, false);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to reject invitation', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function getUserHouseholds(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        logger_1.default.info('Getting user households', { userId });
        const response = await householdService.getHouseholdsByUserId(userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to get user households', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function getPendingInvitations(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        logger_1.default.info('Getting pending invitations', { userId });
        const response = await householdService.getPendingInvitations(userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to get pending invitations', {
            userId: req.user?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}
async function sendInvitationEmail(req, res, next) {
    try {
        const { householdId } = req.params;
        const { email } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
        }
        if (!householdId) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new errorHandler_1.BadRequestError(ERROR_MESSAGES.INVALID_EMAIL);
        }
        logger_1.default.info('Sending invitation email', {
            householdId,
            email,
            userId,
        });
        const response = await householdService.sendInvitationEmail(householdId, email, userId);
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Failed to send invitation email', {
            userId: req.user?.id,
            householdId: req.params.householdId,
            email: req.body.email,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
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
    acceptInvitation,
    rejectInvitation,
    getUserHouseholds,
    getPendingInvitations,
    sendInvitationEmail,
};
