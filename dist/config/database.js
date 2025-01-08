"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prismaExtensions_1 = require("./prismaExtensions");
// Initialize base Prisma Client with logging
const basePrisma = new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
    ],
});
// Set up event listeners before extending
if (process.env.NODE_ENV === 'development') {
    basePrisma.$on('query', (e) => {
        logger_1.default.debug('Query: ' + e.query);
        logger_1.default.debug('Params: ' + e.params);
        logger_1.default.debug('Duration: ' + e.duration + 'ms');
    });
}
basePrisma.$on('error', (e) => {
    logger_1.default.error('Prisma Error: ' + e.message);
});
// Apply extensions after setting up listeners
const prisma = basePrisma.$extends(prismaExtensions_1.prismaExtensions);
// Function to connect to the database
const connectDatabase = async () => {
    try {
        await basePrisma.$connect();
        logger_1.default.info('Successfully connected to the database');
    }
    catch (error) {
        logger_1.default.error('Failed to connect to the database', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
// Function to disconnect from the database
const disconnectDatabase = async () => {
    await basePrisma.$disconnect();
    logger_1.default.info('Disconnected from the database');
};
exports.disconnectDatabase = disconnectDatabase;
exports.default = prisma;
