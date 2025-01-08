"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapResponse = wrapResponse;
exports.handleServiceError = handleServiceError;
exports.emitHouseholdEvent = emitHouseholdEvent;
exports.emitUserEvent = emitUserEvent;
exports.isDefined = isDefined;
exports.validateRequiredFields = validateRequiredFields;
exports.createSuccessResponse = createSuccessResponse;
exports.getPaginationParams = getPaginationParams;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
exports.formatDate = formatDate;
exports.isValidDate = isValidDate;
exports.isValidEmail = isValidEmail;
exports.generateRandomString = generateRandomString;
exports.emitThreadEvent = emitThreadEvent;
const logger_1 = __importDefault(require("./logger"));
const sockets_1 = require("../sockets");
/**
 * Wraps data in an ApiResponse object with optional pagination metadata.
 * @param data - The data to wrap
 * @param paginationMeta - Optional pagination metadata
 * @returns ApiResponse containing the data and optional pagination metadata
 */
function wrapResponse(data, paginationMeta) {
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
function handleServiceError(error, context, metadata) {
    logger_1.default.error(`Failed to ${context}`, {
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
function emitHouseholdEvent(eventName, householdId, data) {
    (0, sockets_1.getIO)().to(`household_${householdId}`).emit(eventName, data);
}
/**
 * Emits a socket event to a user
 * @param eventName - Name of the event to emit
 * @param userId - ID of the user to emit to
 * @param data - Data to emit
 */
function emitUserEvent(eventName, userId, data) {
    (0, sockets_1.getIO)().to(`user_${userId}`).emit(eventName, data);
}
/**
 * Type guard to check if a value is not null or undefined
 */
function isDefined(value) {
    return value !== null && value !== undefined;
}
/**
 * Validates that required fields are present
 * @throws Error if any required fields are missing
 */
function validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter((field) => !isDefined(data[field]));
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
}
/**
 * Creates a standardized success response
 */
function createSuccessResponse(data, message) {
    return {
        data,
        message,
        status: 200,
    };
}
/**
 * Standardized pagination helper
 */
function getPaginationParams(page, limit) {
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
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
/**
 * Helper to safely stringify objects
 */
function safeJsonStringify(obj) {
    try {
        return JSON.stringify(obj);
    }
    catch {
        return '';
    }
}
/**
 * Helper to format dates consistently across services
 */
function formatDate(date) {
    return date.toISOString();
}
/**
 * Helper to check if a date is valid
 */
function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}
/**
 * Helper to validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Helper to generate a random string
 */
function generateRandomString(length) {
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
function emitThreadEvent(eventName, threadId, householdId, data) {
    const io = (0, sockets_1.getIO)();
    // Emit to thread room
    io.to(`thread_${threadId}`).emit(eventName, data);
    // Also emit to household room for broader updates
    io.to(`household_${householdId}`).emit(eventName, data);
}
