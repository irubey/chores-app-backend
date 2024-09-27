import { Socket } from 'socket.io';
import { User } from '@prisma/client';
import { ExtendedError } from 'socket.io/dist/namespace';
import jwt from 'jsonwebtoken';
import prisma from '../config/database'; // Use centralized Prisma client
import dotenv from 'dotenv';
import logger from '../utils/logger'; // Use logger for better debugging
dotenv.config();
/**
 * Interface extending Socket to include authenticated user information.
 * @param socket - The Socket instance.
 * @param next - Callback to proceed to the next middleware or emit an error.
 */
export interface AuthenticatedSocket extends Socket {
  user?: User;
}

/**
 * Middleware to authenticate Socket.IO connections using JWT.
 * @param socket - The socket instance.
 * @param next - Callback to proceed to the next middleware or emit an error.
 */
const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  let token = socket.handshake.auth.token || '';
  console.log('Received token:', token);

  if (!token) {
    logger.warn('Authentication error: Token not provided');
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    console.log('Decoded token:', decoded);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      logger.warn('Authentication error: User not found');
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;

    // Join household rooms
    const householdMembers = await prisma.householdMember.findMany({
      where: { userId: user.id },
      select: { householdId: true },
    });
    householdMembers.forEach((member) => {
      socket.join(`household_${member.householdId}`);
      logger.info(`User ${user.id} joined household_${member.householdId}`);
    });
    next();
  } catch (error) {
    logger.error('Authentication error: Invalid token', { error });
    console.error('JWT verification error:', error);
    return next(new Error('Authentication error: Invalid token'));
  }
};

export default socketAuthMiddleware;
