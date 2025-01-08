"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIME_TYPE_MAP = void 0;
exports.validateFileType = validateFileType;
exports.validateFile = validateFile;
exports.addAttachment = addAttachment;
exports.getAttachment = getAttachment;
exports.deleteAttachment = deleteAttachment;
exports.getMessageAttachments = getMessageAttachments;
const errorHandler_1 = require("../../middlewares/errorHandler");
const database_1 = __importDefault(require("../../config/database"));
const enums_1 = require("../../../node_modules/@irubey/chores-app-shared/dist/enums");
const sockets_1 = require("../../sockets");
const authService_1 = require("../authService");
const messageTransformer_1 = require("../../utils/transformers/messageTransformer");
const logger_1 = __importDefault(require("../../utils/logger"));
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
exports.MIME_TYPE_MAP = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};
/**
 * Validates file type and size
 */
function validateFileType(fileType) {
    if (!Object.keys(exports.MIME_TYPE_MAP).includes(fileType)) {
        throw new Error(`Invalid file type: ${fileType}`);
    }
}
function validateFile(fileType, fileSize) {
    validateFileType(fileType);
    if (fileSize > MAX_FILE_SIZE) {
        throw new errorHandler_1.ValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
}
/**
 * Adds an attachment to a message
 */
async function addAttachment(householdId, threadId, messageId, attachmentData, userId) {
    try {
        logger_1.default.info(`Adding attachment to message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const attachment = await database_1.default.$transaction(async (tx) => {
            // Verify message exists and belongs to thread
            const message = await tx.message.findFirst({
                where: {
                    id: messageId,
                    threadId,
                },
            });
            if (!message) {
                throw new errorHandler_1.NotFoundError('Message not found or does not belong to thread');
            }
            // Verify user owns message or is admin
            if (message.authorId !== userId) {
                const isAdmin = await tx.householdMember.findFirst({
                    where: {
                        householdId,
                        userId,
                        role: enums_1.HouseholdRole.ADMIN,
                    },
                });
                if (!isAdmin) {
                    throw new errorHandler_1.UnauthorizedError('Not authorized to add attachments to this message');
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
            return createdAttachment;
        });
        const transformedAttachment = (0, messageTransformer_1.transformAttachment)(attachment);
        // Emit socket event
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('attachment_update', {
            action: enums_1.MessageAction.ATTACHMENT_ADDED,
            messageId,
            attachment: transformedAttachment,
        });
        logger_1.default.info(`Successfully added attachment ${attachment.id} to message ${messageId}`);
        return wrapResponse(transformedAttachment);
    }
    catch (error) {
        logger_1.default.error(`Error adding attachment: ${error}`);
        throw error;
    }
}
/**
 * Retrieves an attachment by ID
 */
async function getAttachment(householdId, threadId, messageId, attachmentId, userId) {
    try {
        logger_1.default.info(`Retrieving attachment ${attachmentId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const attachment = await database_1.default.attachment.findFirst({
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
            throw new errorHandler_1.NotFoundError('Attachment not found');
        }
        const transformedAttachment = (0, messageTransformer_1.transformAttachment)(attachment);
        return wrapResponse(transformedAttachment);
    }
    catch (error) {
        logger_1.default.error(`Error retrieving attachment: ${error}`);
        throw error;
    }
}
/**
 * Deletes an attachment
 */
async function deleteAttachment(householdId, threadId, messageId, attachmentId, userId) {
    try {
        logger_1.default.info(`Deleting attachment ${attachmentId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        await database_1.default.$transaction(async (tx) => {
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
                throw new errorHandler_1.NotFoundError('Attachment not found');
            }
            // Verify user owns message or is admin
            if (attachment.message.authorId !== userId) {
                const isAdmin = await tx.householdMember.findFirst({
                    where: {
                        householdId,
                        userId,
                        role: enums_1.HouseholdRole.ADMIN,
                    },
                });
                if (!isAdmin) {
                    throw new errorHandler_1.UnauthorizedError('Not authorized to delete this attachment');
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
        (0, sockets_1.getIO)().to(`household_${householdId}`).emit('attachment_update', {
            action: enums_1.MessageAction.ATTACHMENT_REMOVED,
            messageId,
            attachmentId,
        });
        logger_1.default.info(`Successfully deleted attachment ${attachmentId}`);
        return wrapResponse(undefined);
    }
    catch (error) {
        logger_1.default.error(`Error deleting attachment: ${error}`);
        throw error;
    }
}
/**
 * Gets all attachments for a message
 */
async function getMessageAttachments(householdId, threadId, messageId, userId) {
    try {
        logger_1.default.info(`Retrieving attachments for message ${messageId}`);
        await (0, authService_1.verifyMembership)(householdId, userId, [
            enums_1.HouseholdRole.ADMIN,
            enums_1.HouseholdRole.MEMBER,
        ]);
        const attachments = await database_1.default.attachment.findMany({
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
        const transformedAttachments = attachments.map((attachment) => (0, messageTransformer_1.transformAttachment)(attachment));
        return wrapResponse(transformedAttachments);
    }
    catch (error) {
        logger_1.default.error(`Error retrieving message attachments: ${error}`);
        throw error;
    }
}
