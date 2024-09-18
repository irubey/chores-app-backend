"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
// Initialize Prisma Client
const prisma = new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
    ],
});
// Log queries in development environment
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger_1.default.debug('Query: ' + e.query);
        logger_1.default.debug('Params: ' + e.params);
        logger_1.default.debug('Duration: ' + e.duration + 'ms');
    });
}
// Log errors
prisma.$on('error', (e) => {
    logger_1.default.error('Prisma Error: ' + e.message);
});
// Function to connect to the database
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$connect();
        logger_1.default.info('Successfully connected to the database');
    }
    catch (error) {
        logger_1.default.error('Failed to connect to the database:', error);
        process.exit(1);
    }
});
exports.connectDatabase = connectDatabase;
// Function to disconnect from the database
const disconnectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    logger_1.default.info('Disconnected from the database');
});
exports.disconnectDatabase = disconnectDatabase;
exports.default = prisma;
