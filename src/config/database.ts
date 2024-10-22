import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { prismaExtensions } from "./prismaExtensions";

// Initialize base Prisma Client
const basePrisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

// Apply extensions
const prisma = basePrisma.$extends(prismaExtensions);

// Log queries in development environment
if (process.env.NODE_ENV === "development") {
  basePrisma.$on("query", (e) => {
    logger.debug("Query: " + e.query);
    logger.debug("Params: " + e.params);
    logger.debug("Duration: " + e.duration + "ms");
  });
}

// Log errors
basePrisma.$on("error", (e) => {
  logger.error("Prisma Error: " + e.message);
});

// Function to connect to the database
export const connectDatabase = async (): Promise<void> => {
  try {
    await basePrisma.$connect();
    logger.info("Successfully connected to the database");
  } catch (error) {
    logger.error("Failed to connect to the database:", error);
    process.exit(1);
  }
};

// Function to disconnect from the database
export const disconnectDatabase = async (): Promise<void> => {
  await basePrisma.$disconnect();
  logger.info("Disconnected from the database");
};

export default prisma;
