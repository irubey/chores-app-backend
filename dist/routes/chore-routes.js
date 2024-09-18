"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChoreController_1 = require("../controllers/ChoreController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rbacMiddleware_1 = require("../middlewares/rbacMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)({ mergeParams: true });
/**
 * @route   GET /api/households/:householdId/chores
 * @desc    Retrieve all chores for a specific household
 * @access  Protected
 */
router.get('/', authMiddleware_1.authMiddleware, ChoreController_1.ChoreController.getChores);
/**
 * @route   POST /api/households/:householdId/chores
 * @desc    Create a new chore within a household
 * @access  Protected, Admin only
 */
router.post('/', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)(['ADMIN']), (0, validationMiddleware_1.validate)(validationSchemas_1.createChoreSchema), ChoreController_1.ChoreController.createChore);
/**
 * @route   GET /api/households/:householdId/chores/:choreId
 * @desc    Retrieve details of a specific chore
 * @access  Protected
 */
router.get('/:choreId', authMiddleware_1.authMiddleware, ChoreController_1.ChoreController.getChoreDetails);
/**
 * @route   PATCH /api/households/:householdId/chores/:choreId
 * @desc    Update an existing chore
 * @access  Protected, Admin only
 */
router.patch('/:choreId', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)(['ADMIN']), (0, validationMiddleware_1.validate)(validationSchemas_1.updateChoreSchema), ChoreController_1.ChoreController.updateChore);
/**
 * @route   DELETE /api/households/:householdId/chores/:choreId
 * @desc    Delete a chore from a household
 * @access  Protected, Admin only
 */
router.delete('/:choreId', authMiddleware_1.authMiddleware, (0, rbacMiddleware_1.rbacMiddleware)(['ADMIN']), ChoreController_1.ChoreController.deleteChore);
exports.default = router;
