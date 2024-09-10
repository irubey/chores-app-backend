import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { config } from '../config/auth';
import * as auth from '../config/auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Add this new route for development login
export const devLogin = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const devUser = await prisma.user.findUnique({
      where: { email: 'dev@example.com' },
    });

    if (!devUser) {
      console.error('Dev user not found in database');
      return res.status(404).json({ error: 'Dev user not found. Run seed script first.' });
    }

    const token = auth.generateToken(devUser.id);

    console.log('Dev login successful:', { user: devUser, token });
    res.json({ user: devUser, token });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({ error: 'An error occurred during dev login' });
  }
};

// Update the existing login function
export const login = async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    if (provider.toLowerCase() === 'dev' && process.env.NODE_ENV === 'development') {
      return devLogin(req, res);
    }

    const state = auth.generateState();
    
    let redirectUrl;
    switch (provider.toLowerCase()) {
      case 'google':
        redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${config.google.clientId}` +
          `&redirect_uri=${encodeURIComponent(config.google.redirectUri)}` +
          `&response_type=code` +
          `&scope=email profile` +
          `&state=${state}`;
        break;
      // ... other providers
    }

    res.json({ redirect_url: redirectUrl });
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

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user || !authReq.user.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const userId = authReq.user.id;
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

export const handleOAuthCallback = async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, state } = req.query;

  try {
    if (!state) {
      return res.status(400).json({ error: 'Missing state parameter' });
    }

    let tokenData;
    switch (provider) {
      case 'google':
        tokenData = await authService.exchangeGoogleCode(code as string);
        break;
      case 'facebook':
        tokenData = await authService.exchangeFacebookCode(code as string);
        break;
      case 'apple':
        tokenData = await authService.exchangeAppleCode(code as string);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    const userData = await authService.getUserData(provider, tokenData);
    if (!userData) {
      throw new Error('Failed to get user data');
    }
    const user = await auth.findOrCreateUser(userData.email, userData.name, provider, userData.id);
    const token = auth.generateToken(user.id);

    res.redirect(`${process.env.FRONTEND_URL}/oauth?token=${token}&provider=${provider}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};