/**
 * xiaoshazi Unified Error System
 * Provides consistent error handling across the application
 */

// Error status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// Application error codes
const ERROR_CODES = {
  // General errors (1xxx)
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Authentication errors (2xxx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // Authorization errors (3xxx)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resource errors (4xxx)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Rate limiting (5xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // External services (6xxx)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  REDIS_CONNECTION_ERROR: 'REDIS_CONNECTION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

/**
 * Base application error class
 * @extends Error
 */
class AppError extends Error {
  /**
   * Creates an AppError
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application-specific error code
   * @param {boolean} isOperational - Whether this is an operational error (vs programming error)
   * @param {object} meta - Additional metadata
   */
  constructor(message, statusCode, code, isOperational = true, meta = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace in development
    if (process.env.NODE_ENV === 'development') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for API response
   * @returns {object}
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
        ...(this.meta && Object.keys(this.meta).length > 0 && { meta: this.meta }),
      },
    };
  }
}

/**
 * Error factory functions for common error types
 */
const Errors = {
  /**
   * Create a 400 Bad Request error
   */
  badRequest: (message = 'Bad Request', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      true,
      meta
    );
  },

  /**
   * Create a 401 Unauthorized error
   */
  unauthorized: (message = 'Unauthorized', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      true,
      meta
    );
  },

  /**
   * Create a 403 Forbidden error
   */
  forbidden: (message = 'Forbidden', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      true,
      meta
    );
  },

  /**
   * Create a 404 Not Found error
   */
  notFound: (resource = 'Resource', meta = {}) => {
    return new AppError(
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      true,
      meta
    );
  },

  /**
   * Create a 409 Conflict error
   */
  conflict: (message = 'Conflict', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.ALREADY_EXISTS,
      true,
      meta
    );
  },

  /**
   * Create a 422 Unprocessable Entity error
   */
  unprocessable: (message = 'Unprocessable Entity', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      true,
      meta
    );
  },

  /**
   * Create a 429 Too Many Requests error
   */
  rateLimit: (message = 'Too Many Requests', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      true,
      meta
    );
  },

  /**
   * Create a 500 Internal Server Error
   */
  internal: (message = 'Internal Server Error', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      true,
      meta
    );
  },

  /**
   * Create a 500 Internal Server Error for unexpected errors
   * This should NOT expose internal details to clients
   */
  unexpected: (error, meta = {}) => {
    const message = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message || 'An unexpected error occurred';
    
    return new AppError(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.UNKNOWN_ERROR,
      false, // Not operational - this is a bug
      { ...meta, originalError: error.message }
    );
  },

  /**
   * Create a 503 Service Unavailable error
   */
  serviceUnavailable: (message = 'Service Unavailable', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      true,
      meta
    );
  },

  /**
   * Create an authentication error (invalid credentials)
   */
  invalidCredentials: (meta = {}) => {
    return new AppError(
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
      true,
      meta
    );
  },

  /**
   * Create an authentication error (invalid/expired token)
   */
  invalidToken: (message = 'Invalid or expired token', meta = {}) => {
    return new AppError(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_TOKEN,
      true,
      meta
    );
  },
};

/**
 * Async handler wrapper - catches errors and passes to next()
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function
 * @returns {Function} Wrapped function
 */
const catchAsync = (fn) => (...args) => {
  return fn(...args).catch(args[args.length - 1]); // Assumes last arg is next() or catch()
};

module.exports = {
  AppError,
  Errors,
  asyncHandler,
  catchAsync,
  HTTP_STATUS,
  ERROR_CODES,
};
