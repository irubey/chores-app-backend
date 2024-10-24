import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import prisma from "../config/database";
import {
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateAttachmentDTO,
  Message,
  MessageWithDetails,
  Attachment,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { HouseholdRole, MessageAction } from "@shared/enums";
import { getIO } from "../sockets";
import { verifyMembership } from "./authService";
import {
  transformMessage,
  transformMessageWithDetails,
  transformAttachment,
} from "../utils/transformers/messageTransformer";
import {
  PrismaMessageBase,
  PrismaMessageWithFullRelations,
  PrismaAttachmentWithFullRelations,
} from "../utils/transformers/transformerPrismaTypes";

// Helper function to wrap data in ApiResponse
function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Retrieves all messages for a specific thread.
 */
export async function getMessages(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<MessageWithDetails[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const messages = await prisma.message.findMany({
    where: {
      threadId,
      deletedAt: null,
    },
    include: {
      thread: true,
      author: true,
      attachments: {
        include: { message: true },
      },
      reactions: {
        include: {
          user: true,
          message: true,
        },
      },
      mentions: {
        include: {
          user: true,
          message: true,
        },
      },
      reads: {
        include: {
          user: true,
          message: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const transformedMessages = messages.map((message) =>
    transformMessageWithDetails(message as PrismaMessageWithFullRelations)
  );

  return wrapResponse(transformedMessages);
}

/**
 * Creates a new message within a thread.
 */
export async function createMessage(
  householdId: string,
  threadId: string,
  data: CreateMessageDTO,
  userId: string
): Promise<ApiResponse<MessageWithDetails>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const message = await prisma.$transaction(async (tx) => {
    const newMessage = await tx.message.create({
      data: {
        threadId,
        authorId: userId,
        content: data.content,
        attachments: {
          create: data.attachments || [],
        },
        mentions: {
          create:
            data.mentions?.map((userId) => ({
              userId,
              mentionedAt: new Date(),
            })) || [],
        },
        reactions: {
          create: data.reactions || [],
        },
      },
      include: {
        thread: true,
        author: true,
        attachments: {
          include: {
            message: true,
          },
        },
        reactions: {
          include: {
            user: true,
            message: true,
          },
        },
        mentions: {
          include: {
            user: true,
            message: true,
          },
        },
        reads: {
          include: {
            user: true,
            message: true,
          },
        },
      },
    });

    // Update thread's updatedAt timestamp
    await tx.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return newMessage;
  });

  if (!isPrismaMessageWithFullRelations(message)) {
    throw new Error("Failed to create message with all required relations");
  }

  const transformedMessage = transformMessageWithDetails(message);

  // Emit socket event
  getIO().to(`household_${householdId}`).emit("message_update", {
    action: MessageAction.CREATED,
    message: transformedMessage,
  });

  return wrapResponse(transformedMessage);
}

// Add type guard
function isPrismaMessageWithFullRelations(
  message: any
): message is PrismaMessageWithFullRelations {
  return (
    message &&
    message.author &&
    message.thread &&
    typeof message.id === "string" &&
    typeof message.content === "string"
  );
}

/**
 * Retrieves details of a specific message.
 */
export async function getMessageById(
  householdId: string,
  threadId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<Message>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      thread: {
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      },
      author: true,
      attachments: {
        include: {
          message: true,
        },
      },
      reactions: {
        include: {
          user: true,
          message: true,
        },
      },
      mentions: {
        include: {
          user: true,
          message: true,
        },
      },
      reads: {
        include: {
          user: true,
          message: true,
        },
      },
    },
  });

  if (!message) {
    throw new NotFoundError("Message not found.");
  }

  return wrapResponse(
    transformMessage(message as PrismaMessageWithFullRelations)
  );
}

/**
 * Updates an existing message.
 */
export async function updateMessage(
  householdId: string,
  threadId: string,
  messageId: string,
  data: UpdateMessageDTO,
  userId: string
): Promise<ApiResponse<Message>> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { author: true },
  });

  if (!message) {
    throw new NotFoundError("Message not found.");
  }

  if (message.authorId !== userId) {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
  }

  const updatedMessage = await prisma.$transaction(async (tx) => {
    // Update the message
    const updated = await tx.message.update({
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
        attachments: true,
        author: true,
        thread: {
          include: {
            participants: {
              include: {
                user: true,
              },
            },
          },
        },
        reactions: true,
        mentions: true,
        reads: true,
      },
    });

    // Update thread's updatedAt timestamp
    await tx.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return updated;
  });

  const transformedMessage = transformMessage(
    updatedMessage as PrismaMessageBase
  );

  // Socket emission stays outside transaction
  getIO().to(`household_${householdId}`).emit("message_update", {
    action: MessageAction.UPDATED,
    message: transformedMessage,
  });

  return wrapResponse(transformedMessage);
}

/**
 * Deletes a message.
 */
export async function deleteMessage(
  householdId: string,
  threadId: string,
  messageId: string,
  userId: string
): Promise<ApiResponse<void>> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { author: true },
  });

  if (!message) {
    throw new NotFoundError("Message not found.");
  }

  if (message.authorId !== userId) {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
  }

  await prisma.$transaction(async (tx) => {
    // Delete related data first (if not handled by cascading deletes)
    await tx.reaction.deleteMany({
      where: { messageId },
    });

    await tx.mention.deleteMany({
      where: { messageId },
    });

    await tx.messageRead.deleteMany({
      where: { messageId },
    });

    // Delete the message
    await tx.message.delete({ where: { id: messageId } });

    // Update thread's updatedAt timestamp
    await tx.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
  });

  getIO().to(`household_${householdId}`).emit("message_update", {
    action: MessageAction.DELETED,
    messageId,
  });

  return wrapResponse(undefined);
}

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;
type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

function validateFileType(
  fileType: string
): asserts fileType is AllowedFileType {
  if (!ALLOWED_FILE_TYPES.includes(fileType as AllowedFileType)) {
    throw new Error(
      `Unsupported file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
    );
  }
}
/**
 * Adds an attachment to a specific message.
 */
export async function addAttachment(
  householdId: string,
  threadId: string,
  messageId: string,
  attachmentData: CreateAttachmentDTO,
  userId: string
): Promise<ApiResponse<Attachment>> {
  validateFileType(attachmentData.fileType);
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const attachment = await prisma.$transaction(async (tx) => {
    const message = await tx.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError("Message not found.");
    }

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

  getIO().to(`household_${householdId}`).emit("attachment_update", {
    action: MessageAction.ATTACHMENT_ADDED,
    attachment: transformedAttachment,
  });

  return wrapResponse(transformedAttachment);
}

/**
 * Retrieves details of a specific attachment.
 */
export async function getAttachmentById(
  householdId: string,
  threadId: string,
  messageId: string,
  attachmentId: string,
  userId: string
): Promise<ApiResponse<Attachment>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: true,
    },
  });

  if (!attachment) {
    throw new NotFoundError("Attachment not found.");
  }

  const transformedAttachment = transformAttachment(
    attachment as PrismaAttachmentWithFullRelations
  );

  return wrapResponse(transformedAttachment);
}

/**
 * Deletes an attachment from a message.
 */
export async function deleteAttachment(
  householdId: string,
  threadId: string,
  messageId: string,
  attachmentId: string,
  userId: string
): Promise<ApiResponse<void>> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { author: true },
  });

  if (!message) {
    throw new NotFoundError("Message not found.");
  }

  if (message.authorId !== userId) {
    await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);
  }

  await prisma.$transaction(async (tx) => {
    const attachment = await tx.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundError("Attachment not found.");
    }

    await tx.attachment.delete({ where: { id: attachmentId } });

    // Update thread's updatedAt timestamp
    await tx.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
  });

  getIO().to(`household_${householdId}`).emit("attachment_update", {
    action: MessageAction.ATTACHMENT_REMOVED,
    attachmentId,
  });

  return wrapResponse(undefined);
}
