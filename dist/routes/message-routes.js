"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MessageController_1 = require("../controllers/MessageController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages
 * @desc    Retrieve all messages within a specific thread
 * @access  Protected
 */
router.get('/', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getMessages));
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages
 * @desc    Create a new message within a thread
 * @access  Protected
 */
router.post('/', authMiddleware_1.authMiddleware, (0, validationMiddleware_1.validate)(validationSchemas_1.createMessageSchema), (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.createMessage));
/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId
 * @desc    Update an existing message
 * @access  Protected, Message Owner
 */
router.patch('/:messageId', authMiddleware_1.authMiddleware, (0, validationMiddleware_1.validate)(validationSchemas_1.updateMessageSchema), (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.updateMessage));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId
 * @desc    Delete a message from a thread
 * @access  Protected, Admin or Message Owner
 */
router.delete('/:messageId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.deleteMessage));
/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Protected
 */
router.patch('/:messageId/read', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.markMessageAsRead));
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/read-status
 * @desc    Get message read status
 * @access  Protected
 */
router.get('/:messageId/read-status', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getMessageReadStatus));
//Attachment related endpoints
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/attachments
 * @desc    Get message attachments
 * @access  Protected
 */
router.get('/:messageId/attachments', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getMessageAttachments));
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/attachments
 * @desc    Add an attachment to a specific message
 * @access  Protected
 */
router.post('/:messageId/attachments', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.addAttachment));
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/attachments/:attachmentId
 * @desc    Retrieve details of a specific attachment
 * @access  Protected
 */
router.get('/:messageId/attachments/:attachmentId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getAttachment));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/attachments/:attachmentId
 * @desc    Delete an attachment from a message
 * @access  Protected, Admin or Attachment Owner
 */
router.delete('/:messageId/attachments/:attachmentId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.deleteAttachment));
//Mention related endpoints
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/mentions
 * @desc    Create a mention in a message
 * @access  Protected
 */
router.post('/:messageId/mentions', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.createMention));
/**
 * @route   GET /api/households/:householdId/messages/mentions
 * @desc    Get user mentions
 * @access  Protected
 */
router.get('/mentions', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getUserMentions));
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/mentions
 * @desc    Get message mentions
 * @access  Protected
 */
router.get('/:messageId/mentions', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getMessageMentions));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/mentions/:mentionId
 * @desc    Delete a mention from a message
 * @access  Protected
 */
router.delete('/:messageId/mentions/:mentionId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.deleteMention));
/**
 * @route   GET /api/households/:householdId/messages/unread-mentions-count
 * @desc    Get unread mentions count
 * @access  Protected
 */
router.get('/unread-mentions-count', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getUnreadMentionsCount));
//Reaction related endpoints
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/reactions
 * @desc    Add a reaction to a message
 * @access  Protected
 */
router.post('/:messageId/reactions', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.addReaction));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/reactions/:reactionId
 * @desc    Remove a reaction from a message
 * @access  Protected
 */
router.delete('/:messageId/reactions/:reactionId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.removeReaction));
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/reactions
 * @desc    Get message reactions
 * @access  Protected
 */
router.get('/:messageId/reactions', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getMessageReactions));
/**
 * @route   GET /api/households/:householdId/messages/reaction-analytics
 * @desc    Get reaction analytics
 * @access  Protected
 */
router.get('/reaction-analytics', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getReactionAnalytics));
/**
 * @route   GET /api/households/:householdId/messages/reactions-by-type
 * @desc    Get reactions by type
 * @access  Protected
 */
router.get('/reactions-by-type', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getReactionsByType));
//Poll related endpoints
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/polls
 * @desc    Get polls in a thread
 * @access  Protected
 */
router.get('/:messageId/polls', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getPollsInThread));
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId
 * @desc    Get a poll
 * @access  Protected
 */
router.get('/:messageId/polls/:pollId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getPoll));
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/polls
 * @desc    Create a poll
 * @access  Protected
 */
router.post('/:messageId/polls', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.createPoll));
/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId
 * @desc    Update a poll
 * @access  Protected
 */
router.patch('/:messageId/polls/:pollId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.updatePoll));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId
 * @desc    Delete a poll
 * @access  Protected
 */
router.delete('/:messageId/polls/:pollId', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.deletePoll));
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId/vote
 * @desc    Vote on a poll
 * @access  Protected
 */
router.post('/:messageId/polls/:pollId/vote', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.votePoll));
/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId/vote
 * @desc    Remove a vote from a poll
 * @access  Protected
 */
router.delete('/:messageId/polls/:pollId/vote', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.removePollVote));
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId/analytics
 * @desc    Get poll analytics
 * @access  Protected
 */
router.get('/:messageId/polls/:pollId/analytics', authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(MessageController_1.MessageController.getPollAnalytics));
exports.default = router;
