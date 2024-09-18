import { Request, Response } from 'express';
import { authController } from '../src/controllers/authController';
import { authService } from '../src/services/authService';
import { userService } from '../src/services/userService';
import { notificationService } from '../src/services/notificationService';
import { jest } from '@jest/globals';

// Mock the required services
jest.mock('../src/services/authService');
jest.mock('../src/services/userService');
jest.mock('../src/services/notificationService');

describe('authController', () => {
  let authController: authController;
  let mockauthService: jest.Mocked<authService>;
  let mockUserService: jest.Mocked<userService>;
  let mockNotificationService: jest.Mocked<notificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockauthService = new authService() as jest.Mocked<authService>;
    mockUserService = new userService() as jest.Mocked<userService>;
    mockNotificationService = new notificationService() as jest.Mocked<notificationService>;
    authController = new authController(mockauthService, mockUserService, mockNotificationService);

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('login', () => {
    it('should return a token on successful login', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockToken = 'mock-token';
      mockauthService.authenticateUser.mockResolvedValue({ user: mockUser, token: mockToken });

      mockRequest.body = { email: 'test@example.com', oauthProvider: 'GOOGLE', oauthToken: 'mock-oauth-token' };

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUser, token: mockToken });
    });

    it('should call next with an error on authentication failure', async () => {
      mockauthService.authenticateUser.mockRejectedValue(new Error('Authentication failed'));

      mockRequest.body = { email: 'test@example.com', oauthProvider: 'GOOGLE', oauthToken: 'mock-oauth-token' };

      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('logout', () => {
    it('should invalidate the token on logout', async () => {
      mockRequest.user = { id: '1' };
      mockauthService.invalidateToken.mockResolvedValue(undefined);

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockauthService.invalidateToken).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should call next with an error if logout fails', async () => {
      mockRequest.user = { id: '1' };
      mockauthService.invalidateToken.mockRejectedValue(new Error('Logout failed'));

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('refreshToken', () => {
    it('should return a new token on successful refresh', async () => {
      const mockNewToken = 'new-mock-token';
      mockauthService.refreshToken.mockResolvedValue(mockNewToken);

      mockRequest.body = { refreshToken: 'old-refresh-token' };

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ token: mockNewToken });
    });

    it('should call next with an error if token refresh fails', async () => {
      mockauthService.refreshToken.mockRejectedValue(new Error('Token refresh failed'));

      mockRequest.body = { refreshToken: 'old-refresh-token' };

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // Add more test cases for other methods in authController
});