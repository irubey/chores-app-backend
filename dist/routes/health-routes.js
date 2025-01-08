"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Test database connection
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                server: "up",
                database: "up",
            },
        });
    }
    catch (error) {
        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            services: {
                server: "up",
                database: "down",
            },
            error: process.env.NODE_ENV === "development"
                ? error.message
                : "Database connection failed",
        });
    }
}));
exports.default = router;
