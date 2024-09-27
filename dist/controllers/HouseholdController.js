import * as householdService from '../services/householdService';
import { NotFoundError, UnauthorizedError } from '../middlewares/errorHandler';
/**
 * HouseholdController handles all CRUD operations related to households.
 */
export class HouseholdController {
    /**
     * Creates a new household.
     * @param req Authenticated Express Request object containing household data
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async createHousehold(req, res, next) {
        try {
            const householdData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Unauthorized');
            }
            const household = await householdService.createHousehold(householdData, userId);
            res.status(201).json(household);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves details of a specific household.
     * @param req Authenticated Express Request object containing householdId
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async getHousehold(req, res, next) {
        try {
            const householdId = req.params.householdId;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Unauthorized');
            }
            const household = await householdService.getHouseholdById(householdId, userId);
            if (!household) {
                throw new NotFoundError('Household not found');
            }
            res.status(200).json(household);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing household.
     * @param req Authenticated Express Request object containing householdId and update data
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async updateHousehold(req, res, next) {
        try {
            const householdId = req.params.householdId;
            const updateData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Unauthorized');
            }
            const updatedHousehold = await householdService.updateHousehold(householdId, updateData, userId);
            if (!updatedHousehold) {
                throw new NotFoundError('Household not found or you do not have permission to update it');
            }
            res.status(200).json(updatedHousehold);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes a household.
     * @param req Authenticated Express Request object containing householdId
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async deleteHousehold(req, res, next) {
        try {
            const householdId = req.params.householdId;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Unauthorized');
            }
            await householdService.deleteHousehold(householdId, userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Adds a new member to the household.
     * @param req Authenticated Express Request object containing householdId and member data
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async addMember(req, res, next) {
        try {
            const householdId = req.params.householdId;
            const memberData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Unauthorized');
            }
            const newMember = await householdService.addMember(householdId, memberData, userId);
            res.status(201).json(newMember);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Removes a member from the household.
     * @param req Authenticated Express Request object containing householdId and memberId
     * @param res Express Response object
     * @param next Express NextFunction for error handling
     */
    static async removeMember(req, res, next) {
        try {
            const householdId = req.params.householdId;
            const memberId = req.params.memberId;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('Unauthorized');
            }
            await householdService.removeMember(householdId, memberId, userId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
