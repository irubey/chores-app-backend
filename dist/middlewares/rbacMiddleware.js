"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacMiddleware = rbacMiddleware;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Role-Based Access Control Middleware
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function
 */
function rbacMiddleware(allowedRoles) {
    return async (req, res, next) => {
        const authReq = req;
        const user = authReq.user;
        const householdId = req.params.householdId;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }
        if (!householdId) {
            return res.status(400).json({ message: 'Household ID is required.' });
        }
        try {
            const householdMember = await prisma.householdMember.findUnique({
                where: {
                    userId_householdId: {
                        userId: user.id,
                        householdId: householdId,
                    },
                },
            });
            if (!householdMember) {
                return res
                    .status(403)
                    .json({ message: 'You are not a member of this household.' });
            }
            if (allowedRoles.includes(householdMember.role)) {
                return next();
            }
            logger_1.default.warn('Access denied', {
                userId: user.id,
                householdId,
                userRole: householdMember.role,
                requiredRoles: allowedRoles,
            });
            return res.status(403).json({
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
            });
        }
        catch (error) {
            logger_1.default.error('RBAC Middleware Error:', {
                userId: user.id,
                householdId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return res.status(500).json({ message: 'Internal server error.' });
        }
    };
}
