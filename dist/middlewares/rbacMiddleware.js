import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
/**
 * Role-Based Access Control Middleware
 *
 * @param allowedRoles - Array of roles allowed to access the route
 * @returns Middleware function
 */
export function rbacMiddleware(allowedRoles) {
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
    };
}
