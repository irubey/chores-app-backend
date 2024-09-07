import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const login = async (req: Request, res: Response) => {
  try {
    const { idToken, provider } = req.body;
    let userData;

    if (provider === 'google') {
      userData = await authService.verifyGoogleToken(idToken);
    } else if (provider === 'apple') {
      userData = await authService.verifyAppleToken(idToken);
    } else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    if (!userData.email) {
      return res.status(400).json({ error: 'Email not provided in token' });
    }

    const user = await authService.findOrCreateUser(userData.email, userData.name, provider, userData.sub);
    const token = authService.generateToken(user.id);

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

export const callback = (req: Request, res: Response) => {
  const { provider } = req.params;
  res.json({ message: `${provider} OAuth callback handled` });
};

export const logout = (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const user = await authService.getCurrentUser(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
};