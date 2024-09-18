"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ChoreController = void 0;
const choreService = __importStar(require("../services/choreService"));
const errorHandler_1 = require("../middlewares/errorHandler");
/**
 * ChoreController handles all CRUD operations related to chores.
 */
class ChoreController {
    /**
     * Retrieves all chores for a specific household.
     * @param req Authenticated Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static getChores(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const householdId = req.params.householdId;
                const chores = yield choreService.getChores(householdId, req.user.id);
                res.status(200).json(chores);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Creates a new chore within a household.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static createChore(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const householdId = req.params.householdId;
                const choreData = req.body;
                const chore = yield choreService.createChore(householdId, choreData, req.user.id);
                res.status(201).json(chore);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Retrieves details of a specific chore.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static getChoreDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const { householdId, choreId } = req.params;
                const chore = yield choreService.getChoreById(householdId, choreId, req.user.id);
                if (!chore) {
                    throw new errorHandler_1.NotFoundError('Chore not found');
                }
                res.status(200).json(chore);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Updates an existing chore.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static updateChore(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const { householdId, choreId } = req.params;
                const updateData = req.body;
                const updatedChore = yield choreService.updateChore(householdId, choreId, updateData, req.user.id);
                if (!updatedChore) {
                    throw new errorHandler_1.NotFoundError('Chore not found or you do not have permission to update it');
                }
                res.status(200).json(updatedChore);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Deletes a chore from a household.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static deleteChore(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const { householdId, choreId } = req.params;
                yield choreService.deleteChore(householdId, choreId, req.user.id);
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Adds a subtask to a specific chore.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static addSubtask(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const { householdId, choreId } = req.params;
                const subtaskData = req.body;
                const subtask = yield choreService.addSubtask(householdId, choreId, subtaskData, req.user.id);
                res.status(201).json(subtask);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Updates the status of a subtask.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static updateSubtaskStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const { householdId, choreId, subtaskId } = req.params;
                const { status } = req.body;
                const updatedSubtask = yield choreService.updateSubtaskStatus(householdId, choreId, subtaskId, status, req.user.id);
                if (!updatedSubtask) {
                    throw new errorHandler_1.NotFoundError('Subtask not found or you do not have permission to update it');
                }
                res.status(200).json(updatedSubtask);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Deletes a subtask from a chore.
     * @param req Express Request object
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static deleteSubtask(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    throw new errorHandler_1.UnauthorizedError('Unauthorized');
                }
                const { householdId, choreId, subtaskId } = req.params;
                yield choreService.deleteSubtask(householdId, choreId, subtaskId, req.user.id);
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ChoreController = ChoreController;
