"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarIntegrationService = void 0;
const client_1 = require("@prisma/client");
const googleapis_1 = require("googleapis");
const appleCalendarAPI_1 = require("../utils/appleCalendarAPI"); // You'll need to implement this
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class CalendarIntegrationService {
    constructor() {
        this.googleOAuth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        this.appleCalendarAPI = new appleCalendarAPI_1.AppleCalendarAPI(); // Initialize with necessary config
    }
    connectCalendar(userId, provider, authCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let accessToken, refreshToken, expiresAt;
                if (provider === 'google') {
                    const { tokens } = yield this.googleOAuth2Client.getToken(authCode);
                    accessToken = tokens.access_token;
                    refreshToken = tokens.refresh_token;
                    expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
                }
                else if (provider === 'apple') {
                    // Implement Apple Calendar authentication
                    ({ accessToken, refreshToken, expiresAt } = yield this.appleCalendarAPI.authenticate(authCode));
                }
                else {
                    throw new Error('Unsupported calendar provider');
                }
                const calendarIntegration = yield prisma.calendarIntegration.upsert({
                    where: { userId },
                    update: { provider, accessToken, refreshToken, expiresAt },
                    create: { userId, provider, accessToken, refreshToken, expiresAt },
                });
                return calendarIntegration;
            }
            catch (error) {
                logger_1.logger.error('Error connecting calendar:', error);
                throw error;
            }
        });
    }
    disconnectCalendar(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma.calendarIntegration.delete({ where: { userId } });
            }
            catch (error) {
                logger_1.logger.error('Error disconnecting calendar:', error);
                throw error;
            }
        });
    }
    syncEvents(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const integration = yield prisma.calendarIntegration.findUnique({ where: { userId } });
                if (!integration)
                    throw new Error('No calendar integration found for user');
                if (integration.provider === 'google') {
                    yield this.syncGoogleEvents(integration);
                }
                else if (integration.provider === 'apple') {
                    yield this.syncAppleEvents(integration);
                }
            }
            catch (error) {
                logger_1.logger.error('Error syncing events:', error);
                throw error;
            }
        });
    }
    syncGoogleEvents(integration) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implement Google Calendar sync logic
            this.googleOAuth2Client.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken,
            });
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
            // Fetch events and sync with your database
            // ...
        });
    }
    syncAppleEvents(integration) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implement Apple Calendar sync logic
            yield this.appleCalendarAPI.setCredentials(integration.accessToken, integration.refreshToken);
            // Fetch events and sync with your database
            // ...
        });
    }
    getCalendarSyncStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const integration = yield prisma.calendarIntegration.findUnique({ where: { userId } });
                return {
                    lastSynced: (integration === null || integration === void 0 ? void 0 : integration.updatedAt) || null,
                    provider: (integration === null || integration === void 0 ? void 0 : integration.provider) || null,
                };
            }
            catch (error) {
                logger_1.logger.error('Error getting calendar sync status:', error);
                throw error;
            }
        });
    }
    refreshTokenIfNeeded(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const integration = yield prisma.calendarIntegration.findUnique({ where: { userId } });
                if (!integration || !integration.expiresAt)
                    return;
                const now = new Date();
                if (integration.expiresAt > now)
                    return;
                if (integration.provider === 'google') {
                    const { tokens } = yield this.googleOAuth2Client.refreshToken(integration.refreshToken);
                    yield this.updateIntegration(userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date);
                }
                else if (integration.provider === 'apple') {
                    const { accessToken, refreshToken, expiresAt } = yield this.appleCalendarAPI.refreshToken(integration.refreshToken);
                    yield this.updateIntegration(userId, accessToken, refreshToken, expiresAt);
                }
            }
            catch (error) {
                logger_1.logger.error('Error refreshing token:', error);
                throw error;
            }
        });
    }
    updateIntegration(userId, accessToken, refreshToken, expiryDate) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma.calendarIntegration.update({
                where: { userId },
                data: {
                    accessToken,
                    refreshToken,
                    expiresAt: expiryDate ? new Date(expiryDate) : null,
                },
            });
        });
    }
}
exports.calendarIntegrationService = new CalendarIntegrationService();
