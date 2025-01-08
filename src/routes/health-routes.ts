import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

const router = Router();
const prisma = new PrismaClient();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          server: "up",
          database: "up",
        },
      });
    } catch (error: unknown) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          server: "up",
          database: "down",
        },
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Database connection failed",
      });
    }
  })
);

export default router;
