import { verifyToken, verifyRefreshToken, generateToken } from '../utils/tokenUtils';
import { logError } from '../utils/logger';
import { AppError } from './errorHandler';
import prisma from '../config/database';
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const accessToken = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;
        if (!accessToken) {
            throw new AppError('No token provided', 401);
        }
        const decoded = verifyToken(accessToken);
        if (decoded) {
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                throw new AppError('User not found', 401);
            }
            // Cast req to AuthenticatedRequest to assign user
            req.user = user;
            return next();
        }
        // If access token is invalid or expired, attempt to refresh
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new AppError('No refresh token provided', 401);
        }
        const refreshPayload = verifyRefreshToken(refreshToken);
        if (!refreshPayload) {
            throw new AppError('Invalid refresh token', 401);
        }
        const user = await prisma.user.findUnique({ where: { id: refreshPayload.userId } });
        if (!user) {
            throw new AppError('User not found', 401);
        }
        // Generate new access token
        const newAccessToken = generateToken(user);
        res.setHeader('Authorization', `Bearer ${newAccessToken}`);
        // Assign user to request
        req.user = user;
        // Implement token rotation
        const newRefreshToken = generateToken(user, '7d');
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        next();
    }
    catch (error) {
        logError('Authentication failed', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
export default authMiddleware;
