import { ApiResponse, PaginationMeta } from '@shared/interfaces';
import logger from './logger';
import { getIO } from '../sockets';

/**
 * Wraps data in an ApiResponse object with optional pagination metadata.
 * @param data - The data to wrap
 * @param paginationMeta - Optional pagination metadata
 * @returns ApiResponse containing the data and optional pagination metadata
 */
export function wrapResponse<T>(
  data: T,
  paginationMeta?: PaginationMeta
): ApiResponse<T> {
  return {
    data,
    pagination: paginationMeta,
  };
}

/**
 * Standardized error handling for services
 * @param error - The error that was caught
 * @param context - Description of what failed
 * @param metadata - Optional additional data to log
 */
export function handleServiceError(
  error: unknown,
  context: string,
  metadata?: Record<string, unknown>
): never {
  logger.error(`Failed to ${context}`, {
    error: error instanceof Error ? error.message : 'Unknown error',
    ...metadata,
  });
  throw error;
}

/**
 * Emits a socket event to a household room
 * @param eventName - Name of the event to emit
 * @param householdId - ID of the household to emit to
 * @param data - Data to emit
 */
export function emitHouseholdEvent(
  eventName: string,
  householdId: string,
  data: unknown
): void {
  getIO().to(`household_${householdId}`).emit(eventName, data);
}

/**
 * Emits a socket event to a user
 * @param eventName - Name of the event to emit
 * @param userId - ID of the user to emit to
 * @param data - Data to emit
 */
export function emitUserEvent(
  eventName: string,
  userId: string,
  data: unknown
): void {
  getIO().to(`user_${userId}`).emit(eventName, data);
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validates that required fields are present
 * @throws Error if any required fields are missing
 */
export function validateRequiredFields<T extends object>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(
    (field) => !isDefined(data[field])
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    data,
    message,
    status: 200,
  };
}

/**
 * Standardized pagination helper
 */
export function getPaginationParams(
  page?: number,
  limit?: number
): { skip: number; take: number } {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.min(100, Math.max(1, limit || 10));

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
}

/**
 * Helper to safely parse JSON strings
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Helper to safely stringify objects
 */
export function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}

/**
 * Helper to format dates consistently across services
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Helper to check if a date is valid
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Helper to validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper to generate a random string
 */
export function generateRandomString(length: number): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

/**
 * Emits a socket event to a thread room and its household room
 * @param eventName - Name of the event to emit
 * @param threadId - ID of the thread
 * @param householdId - ID of the household containing the thread
 * @param data - Data to emit
 */
export function emitThreadEvent(
  eventName: string,
  threadId: string,
  householdId: string,
  data: unknown
): void {
  const io = getIO();
  // Emit to thread room
  io.to(`thread_${threadId}`).emit(eventName, data);
  // Also emit to household room for broader updates
  io.to(`household_${householdId}`).emit(eventName, data);
}
