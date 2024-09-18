"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("./config/passport"));
const socket_1 = __importDefault(require("./config/socket"));
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middlewares/errorHandler");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const rateLimit_1 = __importDefault(require("./middlewares/rateLimit"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const scheduler_1 = __importDefault(require("./jobs/scheduler"));
// Initialize Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.io
const io = (0, socket_1.default)(server);
// Connect to the database
(0, database_1.connectDatabase)();
// Middleware Setup
// Rate Limiting Middleware
app.use(rateLimit_1.default);
// CORS Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
// Body Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Cookie Parser
app.use((0, cookie_parser_1.default)());
// Session Setup
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Authentication Middleware
app.use((req, res, next) => (0, authMiddleware_1.authMiddleware)(req, res, next));
// Routes
app.use('/api', routes_1.default);
// Error Handling Middleware (should be after other middleware and routes)
app.use(errorHandler_1.errorHandler);
// Start Scheduled Jobs
(0, scheduler_1.default)();
// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
});
