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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
exports.eventService = {
    createEvent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tags } = data, eventData = __rest(data, ["tags"]);
            const event = yield prisma.event.create({
                data: Object.assign(Object.assign({}, eventData), { tags: {
                        create: (tags === null || tags === void 0 ? void 0 : tags.map(tagId => ({ tagId }))) || [],
                    } }),
                include: {
                    tags: true,
                    attachments: true,
                },
            });
            return event;
        });
    },
    getEventById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield prisma.event.findUnique({
                where: { id },
                include: {
                    tags: true,
                    attachments: true,
                },
            });
            if (!event) {
                throw new errors_1.NotFoundError('Event not found');
            }
            return event;
        });
    },
    getEventsByHousehold(householdId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.event.findMany({
                where: { householdId },
                include: {
                    tags: true,
                    attachments: true,
                },
            });
        });
    },
    updateEvent(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tags } = data, updateData = __rest(data, ["tags"]);
            const event = yield prisma.event.update({
                where: { id },
                data: Object.assign(Object.assign({}, updateData), { tags: tags ? {
                        deleteMany: {},
                        create: tags.map(tagId => ({ tagId })),
                    } : undefined }),
                include: {
                    tags: true,
                    attachments: true,
                },
            });
            return event;
        });
    },
    deleteEvent(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma.event.delete({ where: { id } });
        });
    },
    addAttachmentToEvent(eventId, attachmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield prisma.event.findUnique({ where: { id: eventId } });
            if (!event) {
                throw new errors_1.NotFoundError('Event not found');
            }
            const attachment = yield prisma.attachment.create({
                data: Object.assign(Object.assign({}, attachmentData), { eventId }),
            });
            return attachment;
        });
    },
    removeAttachmentFromEvent(eventId, attachmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const attachment = yield prisma.attachment.findFirst({
                where: { id: attachmentId, eventId },
            });
            if (!attachment) {
                throw new errors_1.NotFoundError('Attachment not found for this event');
            }
            yield prisma.attachment.delete({ where: { id: attachmentId } });
        });
    },
    getEventAttachments(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield prisma.event.findUnique({
                where: { id: eventId },
                include: { attachments: true },
            });
            if (!event) {
                throw new errors_1.NotFoundError('Event not found');
            }
            return event.attachments;
        });
    },
};
exports.default = exports.eventService;
