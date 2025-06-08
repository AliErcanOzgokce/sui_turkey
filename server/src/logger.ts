import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, colorize, simple, printf } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Create transports based on environment
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    )
  })
);

// File transports (only in production)
if (process.env.NODE_ENV === 'production') {
  // Combined log
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
      level: 'info',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Error log
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', 'logs', 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', 'logs', 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  exitOnError: false
});

// Log startup message
logger.info('🚀 Sui Turkey Discord Bot - Logger initialized', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
});

export default logger; 