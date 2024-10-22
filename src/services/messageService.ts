import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import prisma from "../config/database";
import {
  CreateMessageDTO,
  UpdateMessageDTO,
  CreateThreadDTO,
  CreateAttachmentDTO,
  Message,
  Thread,
  Attachment,
  UpdateThreadDTO,
  InviteUsersDTO,
} from "@shared/types";
import { ApiResponse } from "@shared/interfaces/apiResponse";
import { HouseholdRole, MessageAction, ThreadAction } from "@shared/enums";
import { getIO } from "../sockets";
import { verifyMembership } from "./authService";
import {
  PrismaMessage,
  PrismaThread,
  PrismaAttachment,
  transformMessage,
  transformThread,
  transformAttachment,
} from "../utils/transformers/messageTransformer";

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
): Promise<ApiResponse<Message[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const messages = await prisma.message.findMany({
    where: { threadId },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  const transformedMessages = messages.map((message) =>
    transformMessage(message as PrismaMessage)
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
): Promise<ApiResponse<Message>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const message = await prisma.message.create({
    data: {
      threadId,
      authorId: userId,
      content: data.content,
      attachments: {
        create: data.attachments || [],
      },
      mentions: {
        create: data.mentions?.map((userId) => ({ userId })) || [],
      },
      reactions: {
        create: data.reactions || [],
      },
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
          attachments: true,
        },
      },
      reactions: true,
      mentions: true,
      reads: true,
    },
  });

  const transformedMessage = transformMessage(message as PrismaMessage);

  getIO().to(`household_${householdId}`).emit("message_update", {
    action: MessageAction.CREATED,
    message: transformedMessage,
  });

  return wrapResponse(transformedMessage);
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
      attachments: true,
      author: true,
      thread: {
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          attachments: true,
        },
      },
      reactions: true,
      mentions: true,
      reads: true,
    },
  });

  if (!message) {
    throw new NotFoundError("Message not found.");
  }

  const transformedMessage = transformMessage(message as PrismaMessage);

  return wrapResponse(transformedMessage);
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
      attachments: true,
      author: true,
      thread: {
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          attachments: true,
        },
      },
      reactions: true,
      mentions: true,
      reads: true,
    },
  });

  const transformedMessage = transformMessage(updatedMessage as PrismaMessage);

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

  await prisma.message.delete({ where: { id: messageId } });

  getIO().to(`household_${householdId}`).emit("message_update", {
    action: MessageAction.DELETED,
    messageId,
  });

  return wrapResponse(undefined);
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
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new NotFoundError("Message not found.");
  }

  const attachment = await prisma.attachment.create({
    data: {
      messageId,
      url: attachmentData.url,
      fileType: attachmentData.fileType,
    },
    include: {
      message: true,
    },
  });

  const transformedAttachment = transformAttachment(
    attachment as PrismaAttachment
  );

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
    attachment as PrismaAttachment
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

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new NotFoundError("Attachment not found.");
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });

  getIO().to(`household_${householdId}`).emit("attachment_update", {
    action: MessageAction.ATTACHMENT_REMOVED,
    attachmentId,
  });

  return wrapResponse(undefined);
}

/**
 * Retrieves all threads for a specific household.
 */
export async function getThreads(
  householdId: string,
  userId: string
): Promise<ApiResponse<Thread[]>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const threads = await prisma.thread.findMany({
    where: { householdId },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
          reactions: true,
          mentions: true,
          reads: true,
        },
      },
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
      attachments: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const transformedThreads = threads.map((thread) =>
    transformThread(thread as PrismaThread)
  );

  return wrapResponse(transformedThreads);
}

/**
 * Creates a new thread.
 */
export async function createThread(
  data: CreateThreadDTO,
  userId: string
): Promise<ApiResponse<Thread>> {
  await verifyMembership(data.householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const thread = await prisma.thread.create({
    data: {
      householdId: data.householdId,
      authorId: userId,
      title: data.title,
      participants: {
        connect: [{ userId_householdId: { userId, householdId } }],
      },
    },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
          reactions: true,
          mentions: true,
          reads: true,
        },
      },
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
      attachments: true,
    },
  });

  const transformedThread = transformThread(thread as PrismaThread);

  getIO().to(`household_${data.householdId}`).emit("thread_update", {
    action: ThreadAction.CREATED,
    thread: transformedThread,
  });

  return wrapResponse(transformedThread);
}

/**
 * Retrieves details of a specific thread.
 */
export async function getThreadById(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<Thread>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
          reactions: true,
          mentions: true,
          reads: true,
        },
      },
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
      attachments: true,
    },
  });

  if (!thread) {
    throw new NotFoundError("Thread not found.");
  }

  const transformedThread = transformThread(thread as PrismaThread);

  return wrapResponse(transformedThread);
}

/**
 * Updates an existing thread.
 */
export async function updateThread(
  householdId: string,
  threadId: string,
  data: UpdateThreadDTO,
  userId: string
): Promise<ApiResponse<Thread>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data: {
      title: data.title,
    },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
          reactions: true,
          mentions: true,
          reads: true,
        },
      },
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
      attachments: true,
    },
  });

  const transformedThread = transformThread(updatedThread as PrismaThread);

  getIO().to(`household_${householdId}`).emit("thread_update", {
    action: ThreadAction.UPDATED,
    thread: transformedThread,
  });

  return wrapResponse(transformedThread);
}

/**
 * Deletes a thread.
 */
export async function deleteThread(
  householdId: string,
  threadId: string,
  userId: string
): Promise<ApiResponse<void>> {
  await verifyMembership(householdId, userId, [HouseholdRole.ADMIN]);

  await prisma.thread.delete({ where: { id: threadId } });

  getIO().to(`household_${householdId}`).emit("thread_update", {
    action: ThreadAction.DELETED,
    threadId,
  });

  return wrapResponse(undefined);
}

/**
 * Invites users to a thread.
 */
export async function inviteUsersToThread(
  householdId: string,
  threadId: string,
  data: InviteUsersDTO,
  userId: string
): Promise<ApiResponse<Thread>> {
  await verifyMembership(householdId, userId, [
    HouseholdRole.ADMIN,
    HouseholdRole.MEMBER,
  ]);

  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data: {
      participants: {
        connect: data.userIds.map((userId) => ({
          userId_householdId: {
            userId,
            householdId,
          },
        })),
      },
    },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
          reactions: true,
          mentions: true,
          reads: true,
        },
      },
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
      attachments: true,
    },
  });

  const transformedThread = transformThread(updatedThread as PrismaThread);

  getIO().to(`household_${householdId}`).emit("thread_update", {
    action: ThreadAction.USERS_INVITED,
    thread: transformedThread,
  });

  return wrapResponse(transformedThread);
}
