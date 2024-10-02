import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, HouseholdRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

type PermissionLevel = 'READ' | 'WRITE' | 'ADMIN';

/**
 * Role-Based Access Control Middleware with finer-grained permission controls
 * 
 * @param requiredPermission - The minimum permission level required for the action
 * @returns Middleware function
 */
export function rbacMiddleware(requiredPermission: PermissionLevel): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
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

      const permissionLevel = getPermissionLevel(householdMember.role);

      if (hasRequiredPermission(permissionLevel, requiredPermission)) {
        return next();
      }

      return res.status(403).json({ message: 'Access denied.' });
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };
}

function getPermissionLevel(role: HouseholdRole): PermissionLevel {
  switch (role) {
    case HouseholdRole.ADMIN:
      return 'ADMIN';
    case HouseholdRole.MEMBER:
      return 'WRITE';
    default:
      return 'READ';
  }
}

function hasRequiredPermission(userPermission: PermissionLevel, requiredPermission: PermissionLevel): boolean {
  const permissionHierarchy: PermissionLevel[] = ['READ', 'WRITE', 'ADMIN'];
  return permissionHierarchy.indexOf(userPermission) >= permissionHierarchy.indexOf(requiredPermission);
}