/**
 * xiaoshazi Error Handler Middleware
 * Centralized error handling for Express
 */

const fs = require('fs');
const path = require('path');
const { AppError, HTTP_STATUS } = require('../utils/errors');

// Log file path
const LOG_FILE = process.env.LOG_FILE || '/tmp/xiaoshazi.log';

/**
 * Log error to file
 * @param {Error} error - Error object
 * @param {string} level - Log level (info, warn, error)
 * @param {object} meta - Additional metadata
 */
function logError(error, level = 'error', meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    level,
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...meta,
  });
  
  console.error(`[${level.toUpperCase()}] ${error.message}`);
  fs.appendFile(LOG_FILE, logEntry + '\n', (err) => {
    if (err) console.error('Error log write failed:', err);
  });
}

/**
 * Development error handler - shows detailed error information
 */
const developmentErrorHandler = (err, req, res, next) => {
  // Don't repeat yourself - if response already sent, log and return
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  logError(err, 'error', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(statusCode).json({
    error: {
      message: err.message,
      code: err.code || 'UNKNOWN_ERROR',
      statusCode,
      ...(err.meta && { meta: err.meta }),
      stack: err.stack,
    },
  });
};

/**
 * Production error handler - shows minimal error information
 */
const productionErrorHandler = (err, req, res, next) => {
  // Don't repeat yourself - if response already sent, log and return
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isOperational = err.isOperational;

  // Log operational errors at warn level, programming errors at error level
  const logLevel = isOperational ? 'warn' : 'error';
  logError(err, logLevel, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Don't expose internal error details to clients
  const message = isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'UNKNOWN_ERROR',
      statusCode,
    },
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl}`,
    HTTP_STATUS.NOT_FOUND,
    'NOT_FOUND',
    true,
    { path: req.originalUrl, method: req.method }
  );
  next(error);
};

/**
 * Global error handler - chooses handler based on environment
 */
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    developmentErrorHandler(err, req, res, next);
  } else {
    productionErrorHandler(err, req, res, next);
  }
};

/**
 * Express async error wrapper
 * Usage: router.get('/', asyncErrorHandler(async (req, res) => { ... }))
 */
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Unhandled promise rejection handler
 */
const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logError(new Error(reason), 'error', { type: 'unhandledRejection' });
  });
};

/**
 * Uncaught exception handler
 */
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logError(error, 'error', { type: 'uncaughtException' });
    // Give logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  handleUnhandledRejections,
  handleUncaughtExceptions,
  logError,
  developmentErrorHandler,
  productionErrorHandler,
};
