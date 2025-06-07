const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
  })
);

// Console format with colors for Railway
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create logs directory if it doesn't exist (only in development)
const fs = require('fs');
const isProduction = process.env.NODE_ENV === 'production';
const logsDir = path.join(__dirname, 'logs');

if (!isProduction && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure transports based on environment
const transports = [
  // Always log to console (Railway shows this)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
];

// Add file transports only in development
if (!isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: logFormat
    })
  );
}

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'discord-bot' },
  transports,
  
  // Handle exceptions (console only in production)
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    ...(isProduction ? [] : [new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })])
  ],
  
  // Handle rejections (console only in production)
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    ...(isProduction ? [] : [new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })])
  ]
});

// Export logger
module.exports = logger; 