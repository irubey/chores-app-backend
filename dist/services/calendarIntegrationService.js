import prisma from '../config/database';
import { OAuthProvider } from '../types';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
import { HouseholdRole } from '@prisma/client';
import { getIO } from '../sockets';
/**
 * Retrieves all calendar events for a specific household.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the requesting user.
 * @returns A list of calendar events.
 * @throws UnauthorizedError if the user is not a household member.
 */
export async function getCalendarEvents(householdId, userId) {
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
    const events = await prisma.event.findMany({
        where: { householdId },
        include: {
            chore: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    return events;
}
/**
 * Creates a new calendar event within a household.
 * @param householdId - The ID of the household.
 * @param data - The event data.
 * @param userId - The ID of the user creating the event.
 * @returns The created event.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 */
export async function createEvent(householdId, data, userId) {
    // Verify user has ADMIN role
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to create events.');
    }
    const event = await prisma.event.create({
        data: {
            householdId,
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime,
            createdById: userId,
            choreId: data.choreId, // Optional association with a chore
        },
        include: {
            chore: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    // Emit real-time event for new calendar event
    getIO().to(`household_${householdId}`).emit('calendar_update', { event });
    return event;
}
/**
 * Updates an existing calendar event.
 * @param householdId - The ID of the household.
 * @param eventId - The ID of the event to update.
 * @param data - The updated event data.
 * @param userId - The ID of the user performing the update.
 * @returns The updated event.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the event does not exist.
 */
export async function updateEvent(householdId, eventId, data, userId) {
    // Verify user has ADMIN role
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to update events.');
    }
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!existingEvent) {
        throw new NotFoundError('Event not found.');
    }
    // Update event
    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime,
            choreId: data.choreId,
        },
        include: {
            chore: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    // Emit real-time event for updated calendar event
    getIO().to(`household_${householdId}`).emit('calendar_update', { event: updatedEvent });
    return updatedEvent;
}
/**
 * Deletes a calendar event from a household.
 * @param householdId - The ID of the household.
 * @param eventId - The ID of the event to delete.
 * @param userId - The ID of the user performing the deletion.
 * @throws UnauthorizedError if the user does not have ADMIN role.
 * @throws NotFoundError if the event does not exist.
 */
export async function deleteEvent(householdId, eventId, userId) {
    // Verify user has ADMIN role
    const membership = await prisma.householdMember.findUnique({
        where: {
            userId_householdId: {
                householdId,
                userId,
            },
        },
    });
    if (!membership || membership.role !== HouseholdRole.ADMIN) {
        throw new UnauthorizedError('You do not have permission to delete events.');
    }
    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        throw new NotFoundError('Event not found.');
    }
    // Delete event
    await prisma.event.delete({
        where: { id: eventId },
    });
    // Emit real-time event for deleted calendar event
    getIO().to(`household_${householdId}`).emit('calendar_update', { eventId });
}
/**
 * Syncs the household calendar with the user's personal calendar.
 * @param householdId - The ID of the household.
 * @param userId - The ID of the user syncing their calendar.
 * @param provider - The OAuth provider (e.g., GOOGLE).
 * @param accessToken - The access token for the OAuth provider.
 * @returns The result of the sync operation.
 * @throws UnauthorizedError if synchronization fails.
 */
export async function syncWithPersonalCalendar(householdId, userId, provider, accessToken) {
    // Fetch user's OAuth integration
    const oauthIntegration = await prisma.oAuthIntegration.findUnique({
        where: {
            userId_provider: {
                userId,
                provider,
            },
        },
    });
    if (!oauthIntegration) {
        throw new UnauthorizedError('OAuth integration not found for the user.');
    }
    // Depending on the provider, interact with their API
    switch (provider) {
        case OAuthProvider.GOOGLE:
            // Example: Sync with Google Calendar using Google APIs
            // You would need to implement actual API calls here
            // This is a placeholder
            const googleSyncResult = await syncWithGoogleCalendar(householdId, accessToken);
            return googleSyncResult;
        // Add cases for other providers like APPLE if needed
        default:
            throw new UnauthorizedError('Unsupported OAuth provider.');
    }
}
/**
 * Placeholder function to sync with Google Calendar.
 * Implement actual Google Calendar API interaction here.
 * @param householdId - The ID of the household.
 * @param accessToken - The access token for Google APIs.
 * @returns The result of the sync operation.
 */
async function syncWithGoogleCalendar(householdId, accessToken) {
    // TODO: Implement Google Calendar API integration
    // Example: Fetch events from Google Calendar and merge with household calendar
    return { message: 'Google Calendar sync not yet implemented.' };
}
