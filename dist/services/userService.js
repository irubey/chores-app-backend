"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middlewares/errorHandler");
const userTransformer_1 = require("../utils/transformers/userTransformer");
const sockets_1 = require("../sockets");
// Helper function to wrap data in ApiResponse
function wrapResponse(data) {
    return { data };
}
// Reusable select object that matches the User interface
const userSelect = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    profileImageURL: true,
    activeHouseholdId: true,
};
/**
 * Retrieves the profile of a user by ID.
 * @param userId - The ID of the user
 * @returns The user profile
 * @throws NotFoundError if the user does not exist
 */
async function getUserProfile(userId) {
    const user = await database_1.default.user.findUnique({
        where: { id: userId },
        select: userSelect,
    });
    if (!user) {
        throw new errorHandler_1.NotFoundError('User not found.');
    }
    const transformedUser = (0, userTransformer_1.transformUser)(user);
    return wrapResponse(transformedUser);
}
/**
 * Updates the user's profile information.
 * @param userId - The ID of the user
 * @param data - The data to update
 * @returns The updated user
 * @throws NotFoundError if the user does not exist
 */
async function updateUserProfile(userId, data) {
    const user = await database_1.default.user.update({
        where: { id: userId },
        data: (0, userTransformer_1.transformUserUpdateInput)(data),
        select: userSelect,
    });
    const transformedUser = (0, userTransformer_1.transformUser)(user);
    // Notify connected clients about the user update
    (0, sockets_1.getIO)().emit('user_updated', { user: transformedUser });
    return wrapResponse(transformedUser);
}
