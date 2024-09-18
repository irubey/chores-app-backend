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
exports.CalendarIntegrationController = void 0;
const logger_1 = require("../utils/logger");
class CalendarIntegrationController {
    constructor(calendarIntegrationService, userService) {
        this.connectCalendar = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.user;
                const { provider, accessToken, refreshToken } = req.body;
                const integration = yield this.calendarIntegrationService.connectCalendar(userId, provider, accessToken, refreshToken);
                res.status(201).json(integration);
            }
            catch (error) {
                logger_1.logger.error('Error connecting calendar:', error);
                res.status(500).json({ error: 'Failed to connect calendar' });
            }
        });
        this.disconnectCalendar = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.user;
                yield this.calendarIntegrationService.disconnectCalendar(userId);
                res.status(200).json({ message: 'Calendar disconnected successfully' });
            }
            catch (error) {
                logger_1.logger.error('Error disconnecting calendar:', error);
                res.status(500).json({ error: 'Failed to disconnect calendar' });
            }
        });
        this.getCalendarEvents = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.user;
                const { startDate, endDate } = req.query;
                const events = yield this.calendarIntegrationService.getCalendarEvents(userId, startDate, endDate);
                res.status(200).json(events);
            }
            catch (error) {
                logger_1.logger.error('Error fetching calendar events:', error);
                res.status(500).json({ error: 'Failed to fetch calendar events' });
            }
        });
        this.syncCalendar = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.user;
                const syncResult = yield this.calendarIntegrationService.syncCalendar(userId);
                res.status(200).json(syncResult);
            }
            catch (error) {
                logger_1.logger.error('Error syncing calendar:', error);
                res.status(500).json({ error: 'Failed to sync calendar' });
            }
        });
        this.getCalendarSyncStatus = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.user;
                const syncStatus = yield this.calendarIntegrationService.getCalendarSyncStatus(userId);
                res.status(200).json(syncStatus);
            }
            catch (error) {
                logger_1.logger.error('Error fetching calendar sync status:', error);
                res.status(500).json({ error: 'Failed to fetch calendar sync status' });
            }
        });
        this.getExternalCalendarEvents = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.user;
                const { startDate, endDate } = req.query;
                const externalEvents = yield this.calendarIntegrationService.getExternalCalendarEvents(userId, startDate, endDate);
                res.status(200).json(externalEvents);
            }
            catch (error) {
                logger_1.logger.error('Error fetching external calendar events:', error);
                res.status(500).json({ error: 'Failed to fetch external calendar events' });
            }
        });
        this.calendarIntegrationService = calendarIntegrationService;
        this.userService = userService;
    }
}
exports.CalendarIntegrationController = CalendarIntegrationController;
