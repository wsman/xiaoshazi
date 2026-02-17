const rateLimit = require('express-rate-limit');
const fs = require('fs');

// 审计日志函数
const AUDIT_LOG_FILE = process.env.AUDIT_LOG_FILE || '/tmp/xiaoshazi-audit.log';

function auditLog(event, data) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, event, ...data });
  console.log(`[AUDIT] ${event}:`, data);
  fs.appendFile(AUDIT_LOG_FILE, logEntry + '\n', (err) => {
    if (err) console.error('审计日志写入失败:', err);
  });
}

// Helper to normalize IP (handle IPv6)
function getClientIp(req) {
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

// 1. 通用 API 限流 - 每分钟 60 次请求
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health' || 
           req.path === '/api/time' || 
           req.path.startsWith('/api/entropy');
  },
  handler: (req, res) => {
    auditLog('RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: 60
    });
  }
});

// 2. 登录限流 - 每 15 分钟 5 次尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const email = req.body?.email || 'unknown';
    return `${getClientIp(req)}:${email}`;
  },
  handler: (req, res) => {
    auditLog('LOGIN_RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      email: req.body?.email,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'LOGIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again in 15 minutes',
      retryAfter: 900
    });
  }
});

// 3. 注册限流 - 每小时 3 次
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('REGISTER_RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'REGISTER_RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts, please try again in 1 hour',
      retryAfter: 3600
    });
  }
});

// 4. Token 刷新限流 - 每分钟 10 次
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('REFRESH_RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'REFRESH_RATE_LIMIT_EXCEEDED',
      message: 'Too many token refresh attempts',
      retryAfter: 60
    });
  }
});

// 5. 密码重置请求限流 - 每小时 3 次
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', {
      ip: getClientIp(req),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts',
      retryAfter: 3600
    });
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  passwordResetLimiter,
  auditLog
};
