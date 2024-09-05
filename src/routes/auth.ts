import express from 'express';
import passport from 'passport';
import { login, callback, logout, getCurrentUser } from '../controllers/authController';

const router = express.Router();

// Route to initiate OAuth login
router.post('/login', login);

// OAuth callback route
router.get('/callback/:provider', passport.authenticate('oauth2', { session: false }), callback);

// Route to logout
router.post('/logout', logout);

// Route to get current user information
router.get('/user', getCurrentUser);

export default router;