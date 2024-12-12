import { Request } from 'express';
import { User } from '@shared/types';
import { Provider } from '@shared/enums';
import { RegisterUserDTO, LoginCredentials } from '@shared/types';

/**
 * Extends the Express Request interface to include authenticated user information.
 */
export interface AuthenticatedRequest<T = any> extends Request {
  user?: User;
  params: {
    householdId?: string;
    memberId?: string;
  };
  body: T;
  cookies: {
    refreshToken?: string;
    accessToken?: string;
  };
  query: {
    includeMembers?: string;
    limit?: string;
    cursor?: string;
    email?: string;
  };
}

/**
 * DTO for creating a new OAuth integration.
 */
export interface OAuthIntegrationDTO {
  userId: string;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
