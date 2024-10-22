import { Thread } from "@prisma/client";
import { NotFoundError, UnauthorizedError } from "../middlewares/errorHandler";
import { CreateThreadDTO, UpdateThreadDTO, UserRole } from "../types";
import { getIO } from "../sockets";
import prisma from "../config/database";

/**
 * Retrieves all threads for a specific household.
 */
export async function getThreads(
  householdId: string,
  userId: string
): Promise<Thread[]> {
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
    throw new UnauthorizedError("You do not have access to this household.");
  }

  const threads = await prisma.thread.findMany({
    where: { householdId },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: true,
      author: true,
      participants: {
        // Updated to include detailed participant info
        include: {
          user: true, // If you need user details
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return threads;
}

/**
 * Creates a new thread within a household.
 */
export async function createThread(
  householdId: string,
  data: CreateThreadDTO,
  userId: string
): Promise<Thread> {
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
    throw new UnauthorizedError("You do not have access to this household.");
  }

  const thread = await prisma.thread.create({
    data: {
      householdId,
      authorId: userId,
      title: data.title,
      participants: {
        connect: [{ userId_householdId: { userId, householdId } }],
      },
    },
    include: {
      messages: true,
      attachments: true,
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  // Emit real-time event for new thread
  getIO().to(`household_${householdId}`).emit("thread_update", { thread });

  return thread;
}

/**
 * Retrieves details of a specific thread.
 */
export async function getThreadById(
  householdId: string,
  threadId: string,
  userId: string
): Promise<Thread | null> {
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
    throw new UnauthorizedError("You do not have access to this household.");
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: true,
      author: true,
      participants: true, // This line is added
    },
  });

  return thread;
}

/**
 * Updates an existing thread.
 */
export async function updateThread(
  householdId: string,
  threadId: string,
  data: UpdateThreadDTO,
  userId: string
): Promise<Thread | null> {
  // Verify thread exists
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { author: true },
  });

  if (!thread) {
    throw new NotFoundError("Thread not found.");
  }

  // Check if the user is the thread owner or has ADMIN role
  if (thread.authorId !== userId) {
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          householdId,
          userId,
        },
      },
    });

    if (!membership || membership.role !== UserRole.ADMIN) {
      throw new UnauthorizedError(
        "You do not have permission to update this thread."
      );
    }
  }

  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data: {
      title: data.title,
    },
    include: {
      messages: true,
      attachments: true,
      author: true,
    },
  });

  // Emit real-time event for updated thread
  getIO()
    .to(`household_${householdId}`)
    .emit("thread_update", { thread: updatedThread });

  return updatedThread;
}

/**
 * Deletes a thread from a household.
 */
export async function deleteThread(
  householdId: string,
  threadId: string,
  userId: string
): Promise<void> {
  // Verify thread exists
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { author: true },
  });

  if (!thread) {
    throw new NotFoundError("Thread not found.");
  }

  // Check if the user is the thread owner or has ADMIN role
  if (thread.authorId !== userId) {
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          householdId,
          userId,
        },
      },
    });

    if (!membership || membership.role !== UserRole.ADMIN) {
      throw new UnauthorizedError(
        "You do not have permission to delete this thread."
      );
    }
  }

  await prisma.thread.delete({
    where: { id: threadId },
  });

  // Emit real-time event for deleted thread
  getIO().to(`household_${householdId}`).emit("thread_update", { threadId });
}

/**
 * Invites users to a thread.
 */
export async function inviteUsers(
  householdId: string,
  threadId: string,
  userIds: string[],
  inviterId: string
): Promise<Thread> {
  // Verify thread exists
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { author: true, participants: true },
  });

  if (!thread) {
    throw new NotFoundError("Thread not found.");
  }

  // Check if the inviter is the thread owner or has ADMIN role
  if (thread.authorId !== inviterId) {
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          householdId,
          userId: inviterId,
        },
      },
    });

    if (!membership || membership.role !== UserRole.ADMIN) {
      throw new UnauthorizedError(
        "You do not have permission to invite users to this thread."
      );
    }
  }

  // Connect users to the thread's participants
  const updatedThread = await prisma.thread.update({
    where: { id: threadId },
    data: {
      participants: {
        connect: userIds.map((userId) => ({
          userId_householdId: { userId, householdId },
        })),
      },
    },
    include: {
      messages: {
        include: {
          attachments: true,
          author: true,
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: true,
      author: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!updatedThread) {
    throw new NotFoundError("Thread not found after update.");
  }

  // Emit real-time event for invited users
  getIO()
    .to(`household_${householdId}`)
    .emit("thread_update", { thread: updatedThread });

  return updatedThread;
}
