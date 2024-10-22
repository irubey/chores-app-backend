import { Router } from "express";
import { MessageController } from "../controllers/MessageController";
import authMiddleware from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import {
  createMessageSchema,
  updateMessageSchema,
} from "../utils/validationSchemas";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages
 * @desc    Retrieve all messages within a specific thread
 * @access  Protected
 */
router.get("/", authMiddleware, asyncHandler(MessageController.getMessages));

/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages
 * @desc    Create a new message within a thread
 * @access  Protected
 */
router.post(
  "/",
  authMiddleware,
  validate(createMessageSchema),
  asyncHandler(MessageController.createMessage)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId
 * @desc    Retrieve details of a specific message
 * @access  Protected
 */
router.get(
  "/:messageId",
  authMiddleware,
  asyncHandler(MessageController.getMessageDetails)
);

/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId
 * @desc    Update an existing message
 * @access  Protected, Message Owner
 */
router.patch(
  "/:messageId",
  authMiddleware,
  validate(updateMessageSchema),
  asyncHandler(MessageController.updateMessage)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId
 * @desc    Delete a message from a thread
 * @access  Protected, Admin or Message Owner
 */
router.delete(
  "/:messageId",
  authMiddleware,
  asyncHandler(MessageController.deleteMessage)
);

/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/attachments
 * @desc    Add an attachment to a specific message
 * @access  Protected
 */
router.post(
  "/:messageId/attachments",
  authMiddleware,
  asyncHandler(MessageController.addAttachment)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/attachments/:attachmentId
 * @desc    Retrieve details of a specific attachment
 * @access  Protected
 */
router.get(
  "/:messageId/attachments/:attachmentId",
  authMiddleware,
  asyncHandler(MessageController.getAttachmentDetails)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/attachments/:attachmentId
 * @desc    Delete an attachment from a message
 * @access  Protected, Admin or Attachment Owner
 */
router.delete(
  "/:messageId/attachments/:attachmentId",
  authMiddleware,
  asyncHandler(MessageController.deleteAttachment)
);

export default router;
