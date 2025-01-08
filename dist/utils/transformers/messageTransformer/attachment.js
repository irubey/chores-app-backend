"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformAttachment = transformAttachment;
exports.transformAttachments = transformAttachments;
function transformAttachment(attachment) {
    return {
        id: attachment.id,
        messageId: attachment.messageId,
        url: attachment.url,
        fileType: attachment.fileType,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
        deletedAt: attachment.deletedAt ?? undefined,
    };
}
function transformAttachments(attachments) {
    return attachments.map(transformAttachment);
}
