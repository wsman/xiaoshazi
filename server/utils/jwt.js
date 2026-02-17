const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 环境变量配置
const JWT_SECRET = process.env.JWT_SECRET || 'xiaoshazi-jwt-secret-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'xiaoshazi-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// 内存存储 (生产环境应使用 Redis)
// 结构: { refreshTokenId: { userId, email, familyId, deviceInfo, createdAt, revoked } }
const refreshTokenStore = new Map();

// Token 家族追踪 - 用于检测 token 重用攻击
// 结构: { familyId: { userId, currentTokenId, isCompromised } }
const tokenFamilies = new Map();

// 审计日志函数
const AUDIT_LOG_FILE = process.env.AUDIT_LOG_FILE || '/tmp/xiaoshazi-audit.log';
const fs = require('fs');

function auditLog(event, data) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, event, ...data });
  console.log(`[AUDIT] ${event}:`, data);
  fs.appendFile(AUDIT_LOG_FILE, logEntry + '\n', (err) => {
    if (err) console.error('审计日志写入失败:', err);
  });
}

/**
 * 生成 Access Token
 * @param {Object} payload - 要编码的用户数据
 * @returns {string} JWT token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
}

/**
 * 生成 Refresh Token (带轮换 ID)
 * @param {Object} payload - 要编码的用户数据
 * @param {string} familyId - 令牌家族 ID
 * @param {string} tokenId - 令牌唯一 ID
 * @returns {string} JWT token
 */
function generateRefreshToken(payload, familyId, tokenId) {
  return jwt.sign(
    { ...payload, familyId, tokenId },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256'
    }
  );
}

/**
 * 生成完整的 Token 对 (带轮换支持)
 * @param {Object} user - 用户对象
 * @param {Object} options - 选项
 * @param {string} options.deviceInfo - 设备信息
 * @param {boolean} options.isRefresh - 是否是刷新操作
 * @param {string} options.familyId - 现有家族 ID (刷新时使用)
 * @returns {Object} { accessToken, refreshToken, tokenId, familyId }
 */
function generateTokens(user, options = {}) {
  const { deviceInfo = 'unknown', isRefresh = false, familyId: existingFamilyId } = options;
  
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  };
  
  // 生成新的令牌家族 ID (首次登录) 或使用现有的 (刷新时)
  const familyId = existingFamilyId || uuidv4();
  const tokenId = uuidv4();
  
  // 如果是刷新操作，标记旧令牌为已撤销
  if (isRefresh && existingFamilyId) {
    revokeRefreshTokenByFamily(existingFamilyId);
  }
  
  // 记录令牌发放
  const tokenRecord = {
    userId: user.id,
    email: user.email,
    familyId,
    tokenId,
    deviceInfo,
    createdAt: Date.now(),
    revoked: false
  };
  
  // 存储令牌记录
  refreshTokenStore.set(tokenId, tokenRecord);
  
  // 更新家族追踪
  tokenFamilies.set(familyId, {
    userId: user.id,
    currentTokenId: tokenId,
    isCompromised: false
  });
  
  // 审计日志
  auditLog('TOKEN_ISSUED', {
    userId: user.id,
    email: user.email,
    familyId,
    tokenId,
    deviceInfo,
    isRefresh
  });
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload, familyId, tokenId),
    tokenId,
    familyId
  };
}

/**
 * 撤销指定家族的刷新令牌 (用于轮换)
 * @param {string} familyId - 令牌家族 ID
 */
function revokeRefreshTokenByFamily(familyId) {
  const family = tokenFamilies.get(familyId);
  if (family) {
    // 标记旧令牌为已撤销
    for (const [tokenId, record] of refreshTokenStore.entries()) {
      if (record.familyId === familyId && tokenId !== family.currentTokenId) {
        record.revoked = true;
      }
    }
    
    auditLog('TOKEN_REVOKED', {
      familyId,
      reason: 'TOKEN_ROTATION',
      userId: family.userId
    });
  }
}

/**
 * 撤销单个刷新令牌
 * @param {string} tokenId - 令牌 ID
 */
function revokeRefreshToken(tokenId) {
  const record = refreshTokenStore.get(tokenId);
  if (record) {
    record.revoked = true;
    
    auditLog('TOKEN_REVOKED', {
      tokenId,
      familyId: record.familyId,
      userId: record.userId,
      reason: 'USER_LOGOUT'
    });
    
    return true;
  }
  return false;
}

/**
 * 验证 Refresh Token (带轮换检查)
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} 解码后的 payload 或 null
 */
async function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const { tokenId, familyId } = payload;
    
    // 检查令牌是否存在且未被撤销
    const record = refreshTokenStore.get(tokenId);
    
    // 如果令牌不存在或已被撤销
    if (!record || record.revoked) {
      // 检测可能的 token 重用攻击!
      if (familyId) {
        const family = tokenFamilies.get(familyId);
        if (family && !family.isCompromised) {
          // 标记家族为已泄露
          family.isCompromised = true;
          
          auditLog('SECURITY_ALERT', {
            event: 'POSSIBLE_TOKEN_REUSE_ATTACK',
            familyId,
            userId: family.userId,
            message: 'Refresh token reuse detected - possible token theft!'
          });
          
          // 撤销整个令牌家族
          revokeRefreshTokenByFamily(familyId);
        }
      }
      
      return null;
    }
    
    // 检查令牌家族是否已被泄露
    const family = tokenFamilies.get(familyId);
    if (family && family.isCompromised) {
      auditLog('SECURITY_ALERT', {
        event: 'COMPROMISED_TOKEN_FAMILY',
        familyId,
        userId: family.userId,
        message: 'Token family marked as compromised'
      });
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
}

/**
 * 验证 Access Token (异步)
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} 解码后的 payload 或 null
 */
async function verifyAccessToken(token) {
  try {
    return await jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Access token verification failed:', error.message);
    return null;
  }
}

/**
 * 同步验证 Access Token (使用 jsonwebtoken)
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的 payload 或 null
 */
function verifyAccessTokenSync(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 同步验证 Refresh Token (使用 jsonwebtoken)
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的 payload 或 null
 */
function verifyRefreshTokenSync(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * 哈希密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 哈希后的密码
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 哈希后的密码
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * 解码 Token (不验证)
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的 payload 或 null
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * 获取用户的有效刷新令牌列表
 * @param {string} userId - 用户 ID
 * @returns {Array} 有效令牌列表
 */
function getUserValidTokens(userId) {
  const validTokens = [];
  for (const [tokenId, record] of refreshTokenStore.entries()) {
    if (record.userId === userId && !record.revoked) {
      validTokens.push({
        tokenId,
        familyId: record.familyId,
        deviceInfo: record.deviceInfo,
        createdAt: record.createdAt
      });
    }
  }
  return validTokens;
}

/**
 * 撤销用户所有令牌 (用于安全事件)
 * @param {string} userId - 用户 ID
 * @returns {number} 撤销的令牌数量
 */
function revokeAllUserTokens(userId) {
  let count = 0;
  for (const [tokenId, record] of refreshTokenStore.entries()) {
    if (record.userId === userId && !record.revoked) {
      record.revoked = true;
      count++;
    }
  }
  
  if (count > 0) {
    auditLog('ALL_TOKENS_REVOKED', {
      userId,
      count,
      reason: 'SECURITY_EVENT'
    });
  }
  
  return count;
}

/**
 * 清理过期令牌 (定时任务)
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  const expiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  let cleaned = 0;
  
  for (const [tokenId, record] of refreshTokenStore.entries()) {
    if (now - record.createdAt > expiryMs) {
      refreshTokenStore.delete(tokenId);
      cleaned++;
    }
  }
  
  // 清理空的家族
  for (const [familyId, family] of tokenFamilies.entries()) {
    const hasValidToken = Array.from(refreshTokenStore.values())
      .some(r => r.familyId === familyId && !r.revoked);
    if (!hasValidToken) {
      tokenFamilies.delete(familyId);
    }
  }
  
  if (cleaned > 0) {
    console.log(`[JWT] Cleaned up ${cleaned} expired refresh tokens`);
  }
}

// 每小时清理一次过期令牌
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  verifyAccessTokenSync,
  verifyRefreshTokenSync,
  hashPassword,
  verifyPassword,
  decodeToken,
  revokeRefreshToken,
  revokeRefreshTokenByFamily,
  revokeAllUserTokens,
  getUserValidTokens,
  auditLog,
  JWT_SECRET,
  REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
