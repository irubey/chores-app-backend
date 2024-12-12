import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createMessageSchema,
  updateMessageSchema,
} from '../utils/validationSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router({ mergeParams: true });

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages
 * @desc    Retrieve all messages within a specific thread
 * @access  Protected
 */
router.get('/', authMiddleware, asyncHandler(MessageController.getMessages));

/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages
 * @desc    Create a new message within a thread
 * @access  Protected
 */
router.post(
  '/',
  authMiddleware,
  validate(createMessageSchema),
  asyncHandler(MessageController.createMessage)
);

/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId
 * @desc    Update an existing message
 * @access  Protected, Message Owner
 */
router.patch(
  '/:messageId',
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
  '/:messageId',
  authMiddleware,
  asyncHandler(MessageController.deleteMessage)
);

/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Protected
 */
router.patch(
  '/:messageId/read',
  authMiddleware,
  asyncHandler(MessageController.markMessageAsRead)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/read-status
 * @desc    Get message read status
 * @access  Protected
 */
router.get(
  '/:messageId/read-status',
  authMiddleware,
  asyncHandler(MessageController.getMessageReadStatus)
);

//Attachment related endpoints
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/attachments
 * @desc    Get message attachments
 * @access  Protected
 */
router.get(
  '/:messageId/attachments',
  authMiddleware,
  asyncHandler(MessageController.getMessageAttachments)
);

/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/attachments
 * @desc    Add an attachment to a specific message
 * @access  Protected
 */
router.post(
  '/:messageId/attachments',
  authMiddleware,
  asyncHandler(MessageController.addAttachment)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/attachments/:attachmentId
 * @desc    Retrieve details of a specific attachment
 * @access  Protected
 */
router.get(
  '/:messageId/attachments/:attachmentId',
  authMiddleware,
  asyncHandler(MessageController.getAttachment)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/attachments/:attachmentId
 * @desc    Delete an attachment from a message
 * @access  Protected, Admin or Attachment Owner
 */
router.delete(
  '/:messageId/attachments/:attachmentId',
  authMiddleware,
  asyncHandler(MessageController.deleteAttachment)
);

//Mention related endpoints
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/mentions
 * @desc    Create a mention in a message
 * @access  Protected
 */
router.post(
  '/:messageId/mentions',
  authMiddleware,
  asyncHandler(MessageController.createMention)
);

/**
 * @route   GET /api/households/:householdId/messages/mentions
 * @desc    Get user mentions
 * @access  Protected
 */
router.get(
  '/mentions',
  authMiddleware,
  asyncHandler(MessageController.getUserMentions)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/mentions
 * @desc    Get message mentions
 * @access  Protected
 */
router.get(
  '/:messageId/mentions',
  authMiddleware,
  asyncHandler(MessageController.getMessageMentions)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/mentions/:mentionId
 * @desc    Delete a mention from a message
 * @access  Protected
 */
router.delete(
  '/:messageId/mentions/:mentionId',
  authMiddleware,
  asyncHandler(MessageController.deleteMention)
);

/**
 * @route   GET /api/households/:householdId/messages/unread-mentions-count
 * @desc    Get unread mentions count
 * @access  Protected
 */
router.get(
  '/unread-mentions-count',
  authMiddleware,
  asyncHandler(MessageController.getUnreadMentionsCount)
);

//Reaction related endpoints
/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/reactions
 * @desc    Add a reaction to a message
 * @access  Protected
 */
router.post(
  '/:messageId/reactions',
  authMiddleware,
  asyncHandler(MessageController.addReaction)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/reactions/:reactionId
 * @desc    Remove a reaction from a message
 * @access  Protected
 */
router.delete(
  '/:messageId/reactions/:reactionId',
  authMiddleware,
  asyncHandler(MessageController.removeReaction)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/reactions
 * @desc    Get message reactions
 * @access  Protected
 */
router.get(
  '/:messageId/reactions',
  authMiddleware,
  asyncHandler(MessageController.getMessageReactions)
);

/**
 * @route   GET /api/households/:householdId/messages/reaction-analytics
 * @desc    Get reaction analytics
 * @access  Protected
 */
router.get(
  '/reaction-analytics',
  authMiddleware,
  asyncHandler(MessageController.getReactionAnalytics)
);

/**
 * @route   GET /api/households/:householdId/messages/reactions-by-type
 * @desc    Get reactions by type
 * @access  Protected
 */
router.get(
  '/reactions-by-type',
  authMiddleware,
  asyncHandler(MessageController.getReactionsByType)
);

//Poll related endpoints
/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/polls
 * @desc    Get polls in a thread
 * @access  Protected
 */
router.get(
  '/:messageId/polls',
  authMiddleware,
  asyncHandler(MessageController.getPollsInThread)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId
 * @desc    Get a poll
 * @access  Protected
 */
router.get(
  '/:messageId/polls/:pollId',
  authMiddleware,
  asyncHandler(MessageController.getPoll)
);

/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/polls
 * @desc    Create a poll
 * @access  Protected
 */
router.post(
  '/:messageId/polls',
  authMiddleware,
  asyncHandler(MessageController.createPoll)
);

/**
 * @route   PATCH /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId
 * @desc    Update a poll
 * @access  Protected
 */
router.patch(
  '/:messageId/polls/:pollId',
  authMiddleware,
  asyncHandler(MessageController.updatePoll)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId
 * @desc    Delete a poll
 * @access  Protected
 */
router.delete(
  '/:messageId/polls/:pollId',
  authMiddleware,
  asyncHandler(MessageController.deletePoll)
);

/**
 * @route   POST /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId/vote
 * @desc    Vote on a poll
 * @access  Protected
 */
router.post(
  '/:messageId/polls/:pollId/vote',
  authMiddleware,
  asyncHandler(MessageController.votePoll)
);

/**
 * @route   DELETE /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId/vote
 * @desc    Remove a vote from a poll
 * @access  Protected
 */
router.delete(
  '/:messageId/polls/:pollId/vote',
  authMiddleware,
  asyncHandler(MessageController.removePollVote)
);

/**
 * @route   GET /api/households/:householdId/threads/:threadId/messages/:messageId/polls/:pollId/analytics
 * @desc    Get poll analytics
 * @access  Protected
 */
router.get(
  '/:messageId/polls/:pollId/analytics',
  authMiddleware,
  asyncHandler(MessageController.getPollAnalytics)
);

export default router;
