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
exports.messageController = exports.MessageController = void 0;
const messageService_1 = require("../services/messageService");
const attachmentService_1 = require("../services/attachmentService");
const validationSchemas_1 = require("../utils/validationSchemas");
class MessageController {
    sendMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { householdId } = req.params;
                const { content, parentMessageId } = req.body;
                const userId = req.user.id;
                const validationError = (0, validationSchemas_1.validateMessage)(content, parentMessageId);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }
                const message = yield messageService_1.messageService.createMessage(householdId, userId, content, parentMessageId);
                res.status(201).json(message);
            }
            catch (error) {
                console.error('Error in sendMessage:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    getMessages(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { householdId } = req.params;
                const { limit, offset } = req.query;
                const messages = yield messageService_1.messageService.getMessagesByHousehold(householdId, Number(limit) || 20, Number(offset) || 0);
                res.json(messages);
            }
            catch (error) {
                console.error('Error in getMessages:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    uploadAttachment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { messageId } = req.params;
                const userId = req.user.id;
                const file = req.file;
                if (!file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }
                const validationError = (0, validationSchemas_1.validateAttachment)(file);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }
                const attachment = yield attachmentService_1.attachmentService.uploadAttachment(messageId, userId, file);
                res.status(201).json(attachment);
            }
            catch (error) {
                console.error('Error in uploadAttachment:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    addTag(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { messageId, tagId } = req.params;
                const tag = yield messageService_1.messageService.addTagToMessage(messageId, tagId);
                res.status(201).json(tag);
            }
            catch (error) {
                console.error('Error in addTag:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    removeTag(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { messageId, tagId } = req.params;
                yield messageService_1.messageService.removeTagFromMessage(messageId, tagId);
                res.status(204).send();
            }
            catch (error) {
                console.error('Error in removeTag:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.MessageController = MessageController;
exports.messageController = new MessageController();
