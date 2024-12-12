import { Response, NextFunction } from 'express';
import logger from '../utils/logger';
import * as householdService from '../services/householdService';
import { HouseholdRole } from '@shared/enums';
import {
  CreateHouseholdDTO,
  UpdateHouseholdDTO,
  AddMemberDTO,
} from '@shared/types';
import { BadRequestError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../types';

const ERROR_MESSAGES = {
  USER_ID_REQUIRED: 'User ID is required',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_HOUSEHOLD_DATA: 'Invalid household data',
  HOUSEHOLD_ID_REQUIRED: 'Household ID is required',
  MEMBER_ID_REQUIRED: 'Member ID is required',
} as const;

export async function createHousehold(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }

    const data = req.body as CreateHouseholdDTO;
    if (!data.name) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_HOUSEHOLD_DATA);
    }

    logger.info('Creating household', { userId, data });

    const response = await householdService.createHousehold(data, userId);
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create household', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function getHouseholdById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }

    logger.info('Getting household by ID', { householdId, userId });

    const response = await householdService.getHouseholdById(
      householdId,
      userId
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get household by ID', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function updateHousehold(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }

    const data = req.body as UpdateHouseholdDTO;
    logger.info('Updating household', { householdId, userId, data });

    const response = await householdService.updateHousehold(
      householdId,
      data,
      userId
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to update household', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function deleteHousehold(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }

    logger.info('Deleting household', { householdId, userId });

    const response = await householdService.deleteHousehold(
      householdId,
      userId
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to delete household', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function getMembers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }

    logger.info('Getting household members', { householdId, userId });

    const response = await householdService.getMembers(householdId, userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get household members', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function addMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const { email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_EMAIL);
    }

    logger.info('Adding member to household', {
      householdId,
      email,
      userId,
    });

    const response = await householdService.addMember(
      householdId,
      { email } as AddMemberDTO,
      userId
    );
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to add member', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function removeMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId, memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }
    if (!memberId) {
      throw new BadRequestError(ERROR_MESSAGES.MEMBER_ID_REQUIRED);
    }

    logger.info('Removing member from household', {
      householdId,
      memberId,
      userId,
    });

    const response = await householdService.removeMember(
      householdId,
      memberId,
      userId
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to remove member', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      memberId: req.params.memberId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function acceptInvitation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }

    logger.info('Accepting household invitation', { householdId, userId });

    const response = await householdService.acceptOrRejectInvitation(
      householdId,
      userId,
      true
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to accept invitation', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function rejectInvitation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }

    logger.info('Rejecting household invitation', { householdId, userId });

    const response = await householdService.acceptOrRejectInvitation(
      householdId,
      userId,
      false
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to reject invitation', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function getUserHouseholds(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }

    logger.info('Getting user households', { userId });

    const response = await householdService.getHouseholdsByUserId(userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get user households', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function getPendingInvitations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }

    logger.info('Getting pending invitations', { userId });

    const response = await householdService.getPendingInvitations(userId);
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get pending invitations', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export async function sendInvitationEmail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { householdId } = req.params;
    const { email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError(ERROR_MESSAGES.USER_ID_REQUIRED);
    }
    if (!householdId) {
      throw new BadRequestError(ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_EMAIL);
    }

    logger.info('Sending invitation email', {
      householdId,
      email,
      userId,
    });

    const response = await householdService.sendInvitationEmail(
      householdId,
      email,
      userId
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to send invitation email', {
      userId: req.user?.id,
      householdId: req.params.householdId,
      email: req.body.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
}

export default {
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
