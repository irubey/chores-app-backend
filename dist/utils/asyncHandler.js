"use strict";
// backend/src/utils/asyncHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
/**
 * Wraps an async function and passes errors to Express's error handler.
 *
 * @param fn - Async function to wrap
 * @returns Express RequestHandler
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
