import passport from 'passport';
import { Router } from 'express';
import { login, callback, logout, getCurrentUser, handleOAuthCallback, devLogin } from '../controllers/authController';
import { authMiddleware, isAuthenticatedRequest } from '../middlewares/authMiddleware';
const router = Router();

// Route to initiate OAuth login
router.post('/login', login);

// OAuth callback route
router.get('/callback/:provider', handleOAuthCallback);

// Route to logout
router.post('/logout', logout);

// Route to get current user information
router.get('/user', authMiddleware, (req, res) => {
  if (isAuthenticatedRequest(req)) {
    getCurrentUser(req, res);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/dev-login', devLogin);

export default router;