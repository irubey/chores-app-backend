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
exports.householdController = exports.HouseholdController = void 0;
const householdService_1 = require("../services/householdService");
const validationSchemas_1 = require("../utils/validationSchemas");
class HouseholdController {
    // Get all households for the authenticated user
    getHouseholds(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const households = yield householdService_1.householdService.getHouseholdsForUser(userId);
                res.json(households);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve households' });
            }
        });
    }
    // Create a new household
    createHousehold(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = (0, validationSchemas_1.validateHouseholdCreation)(req.body);
                if (error)
                    return res.status(400).json({ error: error.details[0].message });
                const userId = req.user.id;
                const household = yield householdService_1.householdService.createHousehold(userId, req.body);
                res.status(201).json(household);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to create household' });
            }
        });
    }
    // Get a specific household
    getHousehold(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const householdId = req.params.id;
                const household = yield householdService_1.householdService.getHouseholdById(householdId);
                if (!household)
                    return res.status(404).json({ error: 'Household not found' });
                res.json(household);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve household' });
            }
        });
    }
    // Update a household
    updateHousehold(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error } = (0, validationSchemas_1.validateHouseholdUpdate)(req.body);
                if (error)
                    return res.status(400).json({ error: error.details[0].message });
                const householdId = req.params.id;
                const updatedHousehold = yield householdService_1.householdService.updateHousehold(householdId, req.body);
                if (!updatedHousehold)
                    return res.status(404).json({ error: 'Household not found' });
                res.json(updatedHousehold);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to update household' });
            }
        });
    }
    // Delete a household
    deleteHousehold(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const householdId = req.params.id;
                const result = yield householdService_1.householdService.deleteHousehold(householdId);
                if (!result)
                    return res.status(404).json({ error: 'Household not found' });
                res.status(204).send();
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to delete household' });
            }
        });
    }
    // Get members of a household
    getHouseholdMembers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const householdId = req.params.id;
                const members = yield householdService_1.householdService.getHouseholdMembers(householdId);
                res.json(members);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to retrieve household members' });
            }
        });
    }
    // Create an invitation for a household
    createInvitation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const householdId = req.params.id;
                const { email } = req.body;
                const invitation = yield householdService_1.householdService.createInvitation(householdId, email, req.user.id);
                res.status(201).json(invitation);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to create invitation' });
            }
        });
    }
}
exports.HouseholdController = HouseholdController;
exports.householdController = new HouseholdController();
