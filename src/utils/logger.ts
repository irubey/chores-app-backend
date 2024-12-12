import type { Request, Response } from 'express';

declare global {
  var requestContext: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'http';
type LogMetadata = Record<string, unknown>;

interface LogEntry {
  message: string;
  metadata?: LogMetadata;
  timestamp: string;
  level: LogLevel;
  service: string;
  requestId?: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  private serviceName = process.env.SERVICE_NAME || 'backend';

  private formatMetadata(metadata?: LogMetadata): string {
    if (!metadata) return '';
    try {
      return Object.entries(metadata)
        .map(([key, value]) => {
          const valueStr =
            typeof value === 'object'
              ? JSON.stringify(value, this.sanitizeError)
              : value;
          return `\n  ${key}: ${valueStr}`;
        })
        .join('');
    } catch (error) {
      return '\n  [Unable to stringify metadata]';
    }
  }

  private sanitizeError(_key: string, value: unknown): unknown {
    if (value instanceof Error) {
      return {
        message: value.message,
        name: value.name,
        stack: this.isProduction ? undefined : value.stack,
      };
    }
    return value;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): LogEntry {
    return {
      message,
      metadata,
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      requestId: this.getRequestId(),
    };
  }

  private getRequestId(): string | undefined {
    if (global.requestContext?.get('requestId')) {
      return global.requestContext.get('requestId');
    }
    return undefined;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const entry = this.createLogEntry(level, message, metadata);
    const formattedMeta = this.formatMetadata(metadata);

    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] [${
      entry.service
    }]${
      entry.requestId ? ` [${entry.requestId}]` : ''
    } ${message}${formattedMeta}`;

    // Console logging with colors in development
    if (!this.isProduction) {
      switch (level) {
      case 'debug':
        console.debug('\x1b[36m%s\x1b[0m', logMessage); // Cyan
        break;
      case 'info':
        console.info('\x1b[32m%s\x1b[0m', logMessage); // Green
        break;
      case 'warn':
        console.warn('\x1b[33m%s\x1b[0m', logMessage); // Yellow
        break;
      case 'error':
        console.error('\x1b[31m%s\x1b[0m', logMessage); // Red
        break;
      case 'http':
        console.log('\x1b[35m%s\x1b[0m', logMessage); // Magenta
        break;
      }
    } else {
      // Production logging (could be replaced with a proper logging service)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, metadata?: LogMetadata) {
    if (!this.isProduction) {
      this.log('debug', message, metadata);
    }
  }

  info(message: string, metadata?: LogMetadata) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: LogMetadata) {
    this.log('error', message, metadata);
  }

  http(message: string, metadata?: LogMetadata) {
    this.log('http', message, metadata);
  }

  // Backend-specific logging methods
  logRequest(req: Request): void {
    this.http('Incoming request', {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: this.isProduction ? '[REDACTED]' : req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      ip: req.ip,
    });
  }

  logResponse(res: Response, duration: number): void {
    this.http('Outgoing response', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      size: res.get('Content-Length'),
    });
  }

  logDBQuery(query: string, params: unknown, duration: number): void {
    this.debug('Database query', {
      query,
      params: this.isProduction ? '[REDACTED]' : params,
      duration: `${duration}ms`,
    });
  }

  logError(error: Error, metadata?: LogMetadata) {
    this.error(error.message, {
      ...metadata,
      stack: this.isProduction ? undefined : error.stack,
      name: error.name,
    });
  }
}

export default new Logger();
