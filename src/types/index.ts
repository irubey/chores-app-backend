import { Request } from "express";
import { User } from "@prisma/client";
import { Provider } from "@shared/enums";

/**
 * Extends the Express Request interface to include authenticated user information.
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
  cookies: {
    refreshToken?: string;
  };
  query: {
    includeMembers?: string;
    limit?: string;
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
