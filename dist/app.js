"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import { initializeSocket } from "./sockets";
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middlewares/errorHandler");
const rateLimit_1 = __importDefault(require("./middlewares/rateLimit"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = __importDefault(require("./utils/logger"));
//TODO: update routes to accept AbortController if greater efficiency is needed
// Initialize Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// CORS Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
}));
// Handle Preflight Requests
app.options("*", (0, cors_1.default)());
// // Initialize Socket.io
// const io = initializeSocket(server);
// Connect to the database
(0, database_1.connectDatabase)();
// Middleware Setup
// Rate Limiting Middleware
app.use(rateLimit_1.default);
// Body Parsers
app.use(express_1.default.json({ strict: false }));
app.use(express_1.default.urlencoded({ extended: true }));
// Cookie Parser with secure settings
app.use((0, cookie_parser_1.default)(process.env.SESSION_SECRET));
// Initialize Passport
// app.use(passport.initialize());
// Routes
app.use("/api", routes_1.default);
// Error Handling Middleware (should be after other middleware and routes)
app.use(errorHandler_1.errorHandler);
// Initialize Scheduled Jobs
// initializeJobs();
// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
});
