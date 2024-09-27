import { HouseholdRole } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import prisma from '../config/database';
import { getIO } from '../sockets';
/**
 * Retrieves all messages for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of messages.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getMessages(householdId, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const messages = await prisma.message.findMany({
        where: { householdId },
        include: {
            threads: true,
            attachments: true,
            author: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    return messages;
}
/**
 * Creates a new message within a household.
 * @param householdId - The ID of the household.
 * @param data - The message data.
 * @param userId - The ID of the user creating the message.
 * @returns The created message.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function createMessage(householdId, data, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const message = await prisma.message.create({
        data: {
            householdId,
            authorId: userId,
            content: data.content,
            attachments: {
                create: data.attachments || [],
            },
        },
        include: {
            threads: true,
            attachments: true,
            author: true,
        },
    });
    // Emit real-time event for new message
    getIO().to(`household_${householdId}`).emit('message_update', { message });
    return message;
}
/**
 * Retrieves details of a specific message.
 * @param householdId - The ID of the household.
 * @param messageId - The ID of the message.
 * @param userId - The ID of the requesting user.
 * @returns The message details.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the message does not exist.
 */
export async function getMessageById(householdId, messageId, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            threads: true,
            attachments: true,
            author: true,
        },
    });
    return message;
}
/**
 * Updates an existing message.
 * @param householdId - The ID of the household.
 * @param messageId - The ID of the message to update.
 * @param data - The updated message data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated message.
 * @throws UnauthorizedError if the user does not have permission.
 * @throws NotFoundError if the message does not exist.
 */
export async function updateMessage(householdId, messageId, data, userId) {
    // Verify user is the author or has ADMIN role
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            author: true,
        },
    });
    if (!message) {
        throw new NotFoundError('Message not found.');
    }
    if (message.authorId !== userId) {
        // Check if user has ADMIN role
        const membership = await prisma.householdMember.findUnique({
            where: {
                userId_householdId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== HouseholdRole.ADMIN) {
            throw new UnauthorizedError('You do not have permission to update this message.');
        }
    }
    const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
            content: data.content,
            attachments: data.attachments
                ? {
                    create: data.attachments,
                }
                : undefined,
        },
        include: {
            threads: true,
            attachments: true,
            author: true,
        },
    });
    // Emit real-time event for updated message
    getIO().to(`household_${householdId}`).emit('message_update', { message: updatedMessage });
    return updatedMessage;
}
/**
 * Deletes a message from a household.
 * @param householdId - The ID of the household.
 * @param messageId - The ID of the message to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have permission.
 * @throws NotFoundError if the message does not exist.
 */
export async function deleteMessage(householdId, messageId, userId) {
    // Verify user is the author or has ADMIN role
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
            author: true,
        },
    });
    if (!message) {
        throw new NotFoundError('Message not found.');
    }
    if (message.authorId !== userId) {
        // Check if user has ADMIN role
        const membership = await prisma.householdMember.findUnique({
            where: {
                userId_householdId: {
                    householdId,
                    userId,
                },
            },
        });
        if (!membership || membership.role !== HouseholdRole.ADMIN) {
            throw new UnauthorizedError('You do not have permission to delete this message.');
        }
    }
    await prisma.message.delete({
        where: { id: messageId },
    });
    // Emit real-time event for deleted message
    getIO().to(`household_${householdId}`).emit('message_update', { messageId });
}
/**
 * Adds a thread to a specific message.
 * @param householdId - The ID of the household.
 * @param messageId - The ID of the message.
 * @param threadData - The thread data.
 * @param userId - The ID of the user adding the thread.
 * @returns The created thread.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the message does not exist.
 */
export async function addThread(householdId, messageId, threadData, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new NotFoundError('Message not found.');
    }
    const thread = await prisma.thread.create({
        data: {
            messageId,
            authorId: userId,
            content: threadData.content,
        },
        include: {
            attachments: true,
            author: true,
        },
    });
    // Emit real-time event for new thread
    getIO().to(`household_${householdId}`).emit('thread_update', { thread });
    return thread;
}
/**
 * Adds an attachment to a specific message.
 * @param householdId - The ID of the household.
 * @param messageId - The ID of the message.
 * @param attachmentData - The attachment data.
 * @param userId - The ID of the user adding the attachment.
 * @returns The created attachment.
 * @throws UnauthorizedError if the user is not a household member.
 * @throws NotFoundError if the message does not exist.
 */
export async function addAttachment(householdId, messageId, attachmentData, userId) {
    // Verify user is a member of the household
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership) {
        throw new UnauthorizedError('You do not have access to this household.');
    }
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });
    if (!message) {
        throw new NotFoundError('Message not found.');
    }
    const attachment = await prisma.attachment.create({
        data: {
            messageId,
            url: attachmentData.url,
            fileType: attachmentData.fileType,
        },
    });
    // Emit real-time event for new attachment
    getIO().to(`household_${householdId}`).emit('attachment_update', { attachment });
    return attachment;
}
