// backend/src/utils/asyncHandler.ts
/**
 * Wraps an async function and passes errors to Express's error handler.
 *
 * @param fn - Async function to wrap
 * @returns Express RequestHandler
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
