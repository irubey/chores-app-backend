import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../middlewares/errorHandler';
import prisma from '../../config/database';
import { ApiResponse } from '@shared/interfaces/apiResponse';
import { HouseholdRole, MessageAction } from '@shared/enums';
import { getIO } from '../../sockets';
import { verifyMembership } from '../authService';
import { Attachment, CreateAttachmentDTO } from '@shared/types';
import { transformAttachment } from '../../utils/transformers/messageTransformer';
import { PrismaAttachmentWithFullRelations } from '../../utils/transformers/transformerPrismaTypes';
import logger from '../../utils/logger';

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIME_TYPE_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
} as const;

/**
 * Validates file type and size
 */
export function validateFileType(
  fileType: string
): asserts fileType is keyof typeof MIME_TYPE_MAP {
  if (!Object.keys(MIME_TYPE_MAP).includes(fileType)) {
    throw new Error(`Invalid file type: ${fileType}`);
  }
}

export function validateFile(fileType: string, fileSize: number): void {
  validateFileType(fileType);

  if (fileSize > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`
    );
  }
}

/**
 * Adds an attachment to a message
 */
export async function addAttachment(
  householdId: string,
  threadId: string,
  messageId: string,
  attachmentData: CreateAttachmentDTO,
  userId: string
): Promise<ApiResponse<Attachment>> {
  try {
    logger.info(`Adding attachment to message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const attachment = await prisma.$transaction(async (tx) => {
      // Verify message exists and belongs to thread
      const message = await tx.message.findFirst({
        where: {
          id: messageId,
          threadId,
        },
      });

      if (!message) {
        throw new NotFoundError(
          'Message not found or does not belong to thread'
        );
      }

      // Verify user owns message or is admin
      if (message.authorId !== userId) {
        const isAdmin = await tx.householdMember.findFirst({
          where: {
            householdId,
            userId,
            role: HouseholdRole.ADMIN,
          },
        });
        if (!isAdmin) {
          throw new UnauthorizedError(
            'Not authorized to add attachments to this message'
          );
        }
      }

      // Create attachment
      const createdAttachment = await tx.attachment.create({
        data: {
          messageId,
          url: attachmentData.url,
          fileType: attachmentData.fileType,
        },
        include: {
          message: true,
        },
      });

      // Update thread's updatedAt timestamp
      await tx.thread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      return createdAttachment as PrismaAttachmentWithFullRelations;
    });

    const transformedAttachment = transformAttachment(attachment);

    // Emit socket event
    getIO().to(`household_${householdId}`).emit('attachment_update', {
      action: MessageAction.ATTACHMENT_ADDED,
      messageId,
      attachment: transformedAttachment,
    });

    logger.info(
      `Successfully added attachment ${attachment.id} to message ${messageId}`
    );
    return wrapResponse(transformedAttachment);
  } catch (error) {
    logger.error(`Error adding attachment: ${error}`);
    throw error;
  }
}

/**
 * Retrieves an attachment by ID
 */
export async function getAttachment(
  householdId: string,
  threadId: string,
  messageId: string,
  attachmentId: string,
  userId: string
): Promise<ApiResponse<Attachment>> {
  try {
    logger.info(`Retrieving attachment ${attachmentId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        messageId,
        message: {
          threadId,
        },
      },
      include: {
        message: true,
      },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const transformedAttachment = transformAttachment(
      attachment as PrismaAttachmentWithFullRelations
    );

    return wrapResponse(transformedAttachment);
  } catch (error) {
    logger.error(`Error retrieving attachment: ${error}`);
    throw error;
  }
}

/**
 * Deletes an attachment
 */
export async function deleteAttachment(
  householdId: string,
  threadId: string,
  messageId: string,
  attachmentId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    logger.info(`Deleting attachment ${attachmentId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    await prisma.$transaction(async (tx) => {
      const attachment = await tx.attachment.findFirst({
        where: {
          id: attachmentId,
          messageId,
          message: {
            threadId,
          },
        },
        include: {
          message: true,
        },
      });

      if (!attachment) {
        throw new NotFoundError('Attachment not found');
      }

      // Verify user owns message or is admin
      if (attachment.message.authorId !== userId) {
        const isAdmin = await tx.householdMember.findFirst({
          where: {
            householdId,
            userId,
            role: HouseholdRole.ADMIN,
          },
        });
        if (!isAdmin) {
          throw new UnauthorizedError(
            'Not authorized to delete this attachment'
          );
        }
      }

      // Soft delete the attachment
      await tx.attachment.delete({
        where: { id: attachmentId },
      });
      // Update thread's updatedAt timestamp
      await tx.thread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });
    });

    // Emit socket event
    getIO().to(`household_${householdId}`).emit('attachment_update', {
      action: MessageAction.ATTACHMENT_REMOVED,
      messageId,
      attachmentId,
    });

    logger.info(`Successfully deleted attachment ${attachmentId}`);
    return wrapResponse(undefined);
  } catch (error) {
    logger.error(`Error deleting attachment: ${error}`);
    throw error;
  }
}

/**
 * Gets all attachments for a message
 */
export async function getMessageAttachments(
  householdId: string,
  threadId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<Attachment[]>> {
  try {
    logger.info(`Retrieving attachments for message ${messageId}`);
    await verifyMembership(householdId, userId, [
      HouseholdRole.ADMIN,
      HouseholdRole.MEMBER,
    ]);

    const attachments = await prisma.attachment.findMany({
      where: {
        messageId,
        message: {
          threadId,
        },
      },
      include: {
        message: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedAttachments = attachments.map((attachment) =>
      transformAttachment(attachment as PrismaAttachmentWithFullRelations)
    );

    return wrapResponse(transformedAttachments);
  } catch (error) {
    logger.error(`Error retrieving message attachments: ${error}`);
    throw error;
  }
}
