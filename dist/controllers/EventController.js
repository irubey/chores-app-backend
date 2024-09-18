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
exports.eventController = exports.EventController = void 0;
const eventService_1 = require("../services/eventService");
const attachmentService_1 = require("../services/attachmentService");
const ApiError_1 = require("../utils/ApiError");
class EventController {
    createEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { householdId } = req.params;
                const userId = req.user.id;
                const eventData = req.body;
                const newEvent = yield eventService_1.eventService.createEvent(householdId, userId, eventData);
                res.status(201).json(newEvent);
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
    getEvents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { householdId } = req.params;
                const events = yield eventService_1.eventService.getEventsByHousehold(householdId);
                res.status(200).json(events);
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
    getEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const event = yield eventService_1.eventService.getEventById(id);
                if (!event) {
                    return res.status(404).json({ error: 'Event not found' });
                }
                res.status(200).json(event);
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
    updateEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const userId = req.user.id;
                const eventData = req.body;
                const updatedEvent = yield eventService_1.eventService.updateEvent(id, userId, eventData);
                res.status(200).json(updatedEvent);
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
    deleteEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const userId = req.user.id;
                yield eventService_1.eventService.deleteEvent(id, userId);
                res.status(204).send();
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
    addAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { eventId } = req.params;
                const userId = req.user.id;
                const file = req.file;
                if (!file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }
                const attachment = yield attachmentService_1.attachmentService.addAttachmentToEvent(eventId, userId, file);
                res.status(201).json(attachment);
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
    getAttachments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { eventId } = req.params;
                const attachments = yield attachmentService_1.attachmentService.getAttachmentsByEvent(eventId);
                res.status(200).json(attachments);
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        });
    }
}
exports.EventController = EventController;
exports.eventController = new EventController();
