import winston from 'winston';
import { format } from 'winston';

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
winston.addColors(colors);

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console(),
  // File transport
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format: logFormat,
  transports,
});

export default logger;

// Helper functions for common log types
export const logError = (message: string, error?: Error) => {
  logger.error(`${message}${error ? ` - ${error.message}` : ''}`);
  if (error && error.stack) {
    logger.debug(error.stack);
  }
};

export const logWarning = (message: string) => {
  logger.warn(message);
};

export const logInfo = (message: string) => {
  logger.info(message);
};

export const logDebug = (message: string) => {
  logger.debug(message);
};

export const logHttp = (message: string) => {
  logger.http(message);
};