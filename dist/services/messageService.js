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
exports.messageService = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const attachmentService_1 = require("./attachmentService");
const tagService_1 = require("./tagService");
const prisma = new client_1.PrismaClient();
exports.messageService = {
    createMessage(householdId, userId, content, parentMessageId, attachments, tagIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const household = yield prisma.household.findUnique({
                where: { id: householdId },
                include: { members: true },
            });
            if (!household) {
                throw new errors_1.NotFoundError('Household not found');
            }
            if (!household.members.some(member => member.userId === userId)) {
                throw new errors_1.ForbiddenError('User is not a member of this household');
            }
            const message = yield prisma.message.create({
                data: {
                    content,
                    householdId,
                    userId,
                    parentMessageId,
                },
            });
            if (attachments && attachments.length > 0) {
                yield attachmentService_1.attachmentService.addAttachmentsToMessage(message.id, attachments);
            }
            if (tagIds && tagIds.length > 0) {
                yield tagService_1.tagService.addTagsToMessage(message.id, tagIds);
            }
            return message;
        });
    },
    getMessages(householdId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (householdId, userId, limit = 50, cursor) {
            const household = yield prisma.household.findUnique({
                where: { id: householdId },
                include: { members: true },
            });
            if (!household) {
                throw new errors_1.NotFoundError('Household not found');
            }
            if (!household.members.some(member => member.userId === userId)) {
                throw new errors_1.ForbiddenError('User is not a member of this household');
            }
            return prisma.message.findMany({
                where: { householdId },
                take: limit,
                skip: cursor ? 1 : 0,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    attachments: true,
                    tags: { include: { tag: true } },
                    replies: {
                        include: {
                            user: true,
                            attachments: true,
                            tags: { include: { tag: true } },
                        },
                    },
                },
            });
        });
    },
    deleteMessage(messageId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield prisma.message.findUnique({
                where: { id: messageId },
                include: { household: { include: { members: true } } },
            });
            if (!message) {
                throw new errors_1.NotFoundError('Message not found');
            }
            if (message.userId !== userId && !message.household.members.some(member => member.userId === userId && member.role === 'ADMIN')) {
                throw new errors_1.ForbiddenError('User is not authorized to delete this message');
            }
            yield prisma.message.delete({ where: { id: messageId } });
        });
    },
    updateMessage(messageId, userId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield prisma.message.findUnique({
                where: { id: messageId },
                include: { household: { include: { members: true } } },
            });
            if (!message) {
                throw new errors_1.NotFoundError('Message not found');
            }
            if (message.userId !== userId) {
                throw new errors_1.ForbiddenError('User is not authorized to update this message');
            }
            return prisma.message.update({
                where: { id: messageId },
                data: { content },
            });
        });
    },
    getMessageById(messageId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    user: true,
                    attachments: true,
                    tags: { include: { tag: true } },
                    replies: {
                        include: {
                            user: true,
                            attachments: true,
                            tags: { include: { tag: true } },
                        },
                    },
                    household: { include: { members: true } },
                },
            });
            if (!message) {
                throw new errors_1.NotFoundError('Message not found');
            }
            if (!message.household.members.some(member => member.userId === userId)) {
                throw new errors_1.ForbiddenError('User is not authorized to view this message');
            }
            return message;
        });
    },
};
exports.default = exports.messageService;
