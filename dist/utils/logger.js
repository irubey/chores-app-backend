"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHttp = exports.logDebug = exports.logInfo = exports.logWarning = exports.logError = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each log level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Tell winston that you want to link the colors 
winston_1.default.addColors(colors);
// Define log format
const logFormat = winston_2.format.combine(winston_2.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_2.format.colorize({ all: true }), winston_2.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define which transports the logger must use
const transports = [
    // Console transport
    new winston_1.default.transports.Console(),
    // File transport
    new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    new winston_1.default.transports.File({ filename: 'logs/all.log' }),
];
// Create the logger instance
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    levels,
    format: logFormat,
    transports,
});
exports.default = logger;
// Helper functions for common log types
const logError = (message, error) => {
    logger.error(`${message}${error ? ` - ${error.message}` : ''}`);
    if (error && error.stack) {
        logger.debug(error.stack);
    }
};
exports.logError = logError;
const logWarning = (message) => {
    logger.warn(message);
};
exports.logWarning = logWarning;
const logInfo = (message) => {
    logger.info(message);
};
exports.logInfo = logInfo;
const logDebug = (message) => {
    logger.debug(message);
};
exports.logDebug = logDebug;
const logHttp = (message) => {
    logger.http(message);
};
exports.logHttp = logHttp;
