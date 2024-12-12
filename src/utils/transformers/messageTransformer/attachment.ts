import { Attachment } from '@shared/types';
import { PrismaAttachmentWithFullRelations } from '../transformerPrismaTypes';

export function transformAttachment(
  attachment: PrismaAttachmentWithFullRelations
): Attachment {
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

export function transformAttachments(
  attachments: PrismaAttachmentWithFullRelations[]
): Attachment[] {
  return attachments.map(transformAttachment);
}
