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
exports.rbacMiddleware = rbacMiddleware;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Role-Based Access Control Middleware
 *
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns Middleware function
 */
function rbacMiddleware(allowedRoles) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const user = req.user;
        const householdId = req.params.householdId; // Assuming the householdId is passed in the route params
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }
        if (!householdId) {
            return res.status(400).json({ message: 'Household ID is required.' });
        }
        try {
            const householdMember = yield prisma.householdMember.findUnique({
                where: {
                    userId_householdId: {
                        userId: user.id,
                        householdId: householdId,
                    },
                },
            });
            if (!householdMember) {
                return res.status(403).json({ message: 'You are not a member of this household.' });
            }
            if (allowedRoles.includes(householdMember.role)) {
                return next();
            }
            return res.status(403).json({ message: 'Access denied.' });
        }
        catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    });
}
