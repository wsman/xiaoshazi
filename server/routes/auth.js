const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 认证
 *   description: 用户认证相关接口
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 注册新用户
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 用户邮箱
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: 用户密码（至少6位）
 *               deviceInfo:
 *                 type: string
 *                 description: 设备信息（可选）
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *             deviceInfo: "Chrome/120.0"
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 用户已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *           example:
 *             email: "admin@xiaoshazi.com"
 *             password: "admin123"
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       401:
 *         description: 认证失败
 *       429:
 *         description: 登录尝试过于频繁
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *       401:
 *         description: 无效或过期的刷新令牌
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [认证]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 可选的刷新令牌（用于撤销）
 *     responses:
 *       200:
 *         description: 登出成功
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [认证]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未认证
 */

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: 验证令牌是否有效
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: 令牌有效
 *       401:
 *         description: 令牌无效或过期
 */

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: 获取用户的有效会话列表
 *     tags: [认证]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 会话列表
 *       401:
 *         description: 未认证
 */
const { 
  generateTokens, 
  verifyRefreshToken, 
  verifyAccessTokenSync,
  hashPassword, 
  verifyPassword,
  revokeRefreshToken,
  auditLog
} = require('../utils/jwt');

const {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimiter');

// 模拟用户数据库 (生产环境应使用真实数据库)
const users = new Map();

// 登录尝试追踪 (防止暴力破解)
const loginAttempts = new Map();

function cleanupLoginAttempts() {
  const now = Date.now();
  const expiryMs = 15 * 60 * 1000; // 15 分钟
  
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.windowStart > expiryMs) {
      loginAttempts.delete(key);
    }
  }
}

// 每 5 分钟清理一次
setInterval(cleanupLoginAttempts, 5 * 60 * 1000);

// 初始化一个测试用户
const testUser = {
  id: '1',
  email: 'admin@xiaoshazi.com',
  password: '$2b$10$r4WHthmhmztRKF/DTyEVeON.tSqhahBviEcp8bCpRu4GcWs68K5nK', // password: admin123
  role: 'admin',
  createdAt: new Date().toISOString()
};
users.set(testUser.email, testUser);

/**
 * POST /api/auth/register
 * 注册新用户
 */
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }
    
    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // 检查用户是否已存在
    if (users.has(email)) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }
    
    // 哈希密码并创建用户
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: String(users.size + 1),
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    users.set(email, newUser);
    
    // 生成 Token (带设备信息)
    const tokens = generateTokens(newUser, { 
      deviceInfo: deviceInfo || req.get('User-Agent') || 'unknown' 
    });
    
    // 审计日志 - 注册成功
    auditLog('USER_REGISTERED', {
      userId: newUser.id,
      email: newUser.email,
      ip: req.ip,
      deviceInfo: deviceInfo || req.get('User-Agent')
    });
    
    // 返回用户信息 (不包含密码)
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    
    // 审计日志 - 注册失败
    auditLog('REGISTER_FAILED', {
      email: req.body?.email,
      ip: req.ip,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }
    
    // 检查登录尝试次数 (暴力破解防护)
    const loginKey = `${req.ip}:${email}`;
    const now = Date.now();
    let attempts = loginAttempts.get(loginKey);
    
    if (!attempts || now - attempts.windowStart > 15 * 60 * 1000) {
      attempts = { count: 0, windowStart: now };
    }
    
    if (attempts.count >= 5) {
      // 审计日志 - 登录尝试过于频繁
      auditLog('LOGIN_RATE_LIMIT_EXCEEDED', {
        email,
        ip: req.ip,
        attempts: attempts.count
      });
      
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts',
        message: 'Please try again in 15 minutes',
        retryAfter: 900
      });
    }
    
    // 查找用户
    const user = users.get(email);
    
    if (!user) {
      // 增加失败计数
      attempts.count++;
      loginAttempts.set(loginKey, attempts);
      
      // 审计日志 - 用户不存在
      auditLog('LOGIN_FAILED_USER_NOT_FOUND', {
        email,
        ip: req.ip,
        attemptNumber: attempts.count
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      // 增加失败计数
      attempts.count++;
      loginAttempts.set(loginKey, attempts);
      
      // 审计日志 - 密码错误
      auditLog('LOGIN_FAILED_INVALID_PASSWORD', {
        userId: user.id,
        email,
        ip: req.ip,
        attemptNumber: attempts.count
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // 登录成功 - 重置计数
    loginAttempts.delete(loginKey);
    
    // 生成 Token (带设备信息，进行 token 轮换)
    const tokens = generateTokens(user, { 
      deviceInfo: deviceInfo || req.get('User-Agent') || 'unknown' 
    });
    
    // 审计日志 - 登录成功
    auditLog('LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      deviceInfo: deviceInfo || req.get('User-Agent'),
      familyId: tokens.familyId
    });
    
    // 返回用户信息 (不包含密码)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        ...tokens
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    // 审计日志 - 登录异常
    auditLog('LOGIN_ERROR', {
      email: req.body?.email,
      ip: req.ip,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * POST /api/auth/refresh
 * 刷新 Access Token (带 Token 轮换)
 */
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }
    
    // 验证 Refresh Token (包含轮换检查)
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload) {
      // 审计日志 - Token 验证失败
      auditLog('TOKEN_REFRESH_FAILED', {
        ip: req.ip,
        reason: 'INVALID_TOKEN'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid, expired, or has been revoked'
      });
    }
    
    // 从数据库获取最新用户信息
    const user = users.get(payload.email);
    
    if (!user) {
      // 审计日志 - 用户不存在
      auditLog('TOKEN_REFRESH_FAILED', {
        email: payload.email,
        ip: req.ip,
        reason: 'USER_NOT_FOUND'
      });
      
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User no longer exists'
      });
    }
    
    // 生成新的 Token 对 (实现轮换)
    const tokens = generateTokens(user, { 
      deviceInfo: req.get('User-Agent') || 'unknown',
      isRefresh: true,
      familyId: payload.familyId
    });
    
    // 审计日志 - Token 刷新成功 (轮换)
    auditLog('TOKEN_REFRESH_SUCCESS', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      oldFamilyId: payload.familyId,
      newFamilyId: tokens.familyId,
      oldTokenId: payload.tokenId,
      newTokenId: tokens.tokenId
    });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully (token rotated)',
      data: tokens
    });
    
  } catch (error) {
    console.error('Refresh error:', error);
    
    // 审计日志 - 刷新异常
    auditLog('TOKEN_REFRESH_ERROR', {
      ip: req.ip,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred during token refresh'
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出 (撤销当前令牌)
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let tokenId = null;
    
    // 如果提供了刷新令牌，尝试撤销
    const { refreshToken } = req.body;
    if (refreshToken) {
      const payload = verifyAccessTokenSync(refreshToken);
      if (payload?.tokenId) {
        revokeRefreshToken(payload.tokenId);
        tokenId = payload.tokenId;
      }
    }
    
    // 审计日志 - 登出
    auditLog('LOGOUT', {
      userId: req.user?.id || null,
      email: req.user?.email || null,
      ip: req.ip,
      tokenId
    });
    
    res.json({
      success: true,
      message: 'Logout successful',
      data: null
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * POST /api/auth/logout-all
 * 撤销用户所有令牌
 */
router.post('/logout-all', async (req, res) => {
  try {
    const { revokeAllUserTokens } = require('../utils/jwt');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Please login first'
      });
    }
    
    // 撤销所有令牌
    const count = revokeAllUserTokens(req.user.id);
    
    // 审计日志 - 撤销所有令牌
    auditLog('LOGOUT_ALL', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      revokedCount: count
    });
    
    res.json({
      success: true,
      message: 'All tokens revoked successfully',
      data: { revokedCount: count }
    });
    
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'No token provided'
    });
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  const payload = verifyAccessTokenSync(token);
  
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
  
  // 从数据库获取用户信息
  const user = users.get(payload.email);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      message: 'User no longer exists'
    });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

/**
 * POST /api/auth/verify
 * 验证 token 是否有效
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Missing token',
      message: 'Token is required'
    });
  }
  
  const payload = verifyAccessTokenSync(token);
  
  if (!payload) {
    return res.status(401).json({
      success: false,
      valid: false,
      message: 'Token is invalid or expired'
    });
  }
  
  res.json({
    success: true,
    valid: true,
    data: payload
  });
});

/**
 * GET /api/auth/sessions
 * 获取用户的有效会话列表
 */
router.get('/sessions', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'No token provided'
    });
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  const payload = verifyAccessTokenSync(token);
  
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
  
  const { getUserValidTokens } = require('../utils/jwt');
  const sessions = getUserValidTokens(payload.id);
  
  res.json({
    success: true,
    data: sessions
  });
});

module.exports = router;
