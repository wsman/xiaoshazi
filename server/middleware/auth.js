const { verifyAccessToken, verifyAccessTokenSync } = require('../utils/jwt');

/**
 * JWT 验证中间件
 * 用于保护需要认证的 API 路由
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      message: 'Authorization header is required'
    });
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      message: 'Invalid authorization format. Use: Bearer <token>'
    });
  }
  
  // 同步验证 (更快)
  const payload = verifyAccessTokenSync(token);
  
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
  
  // 将用户信息附加到请求对象
  req.user = payload;
  next();
}

/**
 * 可选的认证中间件
 * 如果提供了 token 则验证，但不强制要求
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  const payload = verifyAccessTokenSync(token);
  req.user = payload || null;
  next();
}

/**
 * 角色验证中间件
 * @param {string|string[]} roles - 允许的角色
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login first'
      });
    }
    
    const userRole = req.user.role;
    
    // 如果 roles 是数组，检查是否包含用户角色
    // 如果是字符串，直接比较
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * 生成 401 响应
 */
function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message
  });
}

/**
 * 生成 403 响应
 */
function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({
    success: false,
    error: 'Forbidden',
    message
  });
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  unauthorized,
  forbidden
};
