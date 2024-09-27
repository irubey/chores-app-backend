import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import authMiddleware from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { createMessageSchema, updateMessageSchema, createThreadSchema, createAttachmentSchema, } from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';
const router = Router({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/messages
 * @desc    Retrieve all messages for a specific household
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(MessageController.getMessages));
/**
 * @route   POST /api/households/:householdId/messages
 * @desc    Create a new message within a household
 * @access  Protected
 */
router.post('/', authMiddleware, validate(createMessageSchema), asyncHandler(MessageController.createMessage));
/**
 * @route   GET /api/households/:householdId/messages/:messageId
 * @desc    Retrieve details of a specific message
 * @access  Protected
 */
router.get('/:messageId', authMiddleware, asyncHandler(MessageController.getMessageDetails));
/**
 * @route   PATCH /api/households/:householdId/messages/:messageId
 * @desc    Update an existing message
 * @access  Protected
 */
router.patch('/:messageId', authMiddleware, validate(updateMessageSchema), asyncHandler(MessageController.updateMessage));
/**
 * @route   DELETE /api/households/:householdId/messages/:messageId
 * @desc    Delete a message from a household
 * @access  Protected
 */
router.delete('/:messageId', authMiddleware, asyncHandler(MessageController.deleteMessage));
/**
 * @route   POST /api/households/:householdId/messages/:messageId/threads
 * @desc    Add a thread to a specific message
 * @access  Protected
 */
router.post('/:messageId/threads', authMiddleware, validate(createThreadSchema), asyncHandler(MessageController.addThread));
/**
 * @route   POST /api/households/:householdId/messages/:messageId/attachments
 * @desc    Add an attachment to a specific message
 * @access  Protected
 */
router.post('/:messageId/attachments', authMiddleware, validate(createAttachmentSchema), asyncHandler(MessageController.addAttachment));
export default router;
