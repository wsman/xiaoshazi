const { z } = require('zod');

/**
 * 用户相关 Schema
 */
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string().optional()
}).refine(data => !data.confirmPassword || data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * Agent 相关 Schema
 */
const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  endpoint: z.string().url('Invalid endpoint URL').optional(),
  model: z.string().min(1, 'Model is required').max(100, 'Model name is too long'),
  capabilities: z.array(z.string()).optional(),
  provider: z.string().optional(),
  tier: z.enum(['S', 'A', 'B', 'C', 'D']).optional()
});

const agentUpdateSchema = agentSchema.partial();

/**
 * Ranking 相关 Schema
 */
const rankingSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  score: z.number().min(0, 'Score must be at least 0').max(100, 'Score must be at most 100'),
  timestamp: z.string().datetime().optional(),
  scenario: z.string().optional()
});

const rankingBatchSchema = z.array(rankingSchema);

/**
 * 通用验证 Schema
 */
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

/**
 * Token 验证 Schema
 */
const tokenVerifySchema = z.object({
  token: z.string().min(1, 'Token is required')
});

/**
 * 系统配置 Schema
 */
const configSchema = z.object({
  key: z.string().min(1, 'Config key is required'),
  value: z.any(),
  description: z.string().optional()
});

/**
 * 验证中间件工厂函数
 * @param {z.ZodSchema} schema - Zod schema
 * @param {string} source - 数据来源 ('body' | 'query' | 'params')
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.parse(data);
      
      // 将验证后的数据写回请求对象
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Validation error',
        message: 'An unexpected validation error occurred'
      });
    }
  };
}

/**
 * 验证并返回解析后的数据
 * @param {z.ZodSchema} schema - Zod schema
 * @param {Object} data - 要验证的数据
 * @returns {{ success: boolean, data?: any, error?: string }}
 */
function safeParse(schema, data) {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return { success: false, error: 'Validation failed', details: errors };
    }
    return { success: false, error: 'Unexpected validation error' };
  }
}

module.exports = {
  // User schemas
  userSchema,
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  
  // Agent schemas
  agentSchema,
  agentUpdateSchema,
  
  // Ranking schemas
  rankingSchema,
  rankingBatchSchema,
  
  // Common schemas
  paginationSchema,
  idParamSchema,
  searchQuerySchema,
  
  // Config schemas
  configSchema,
  tokenVerifySchema,
  
  // Utilities
  validate,
  safeParse,
  
  // Zod instance for custom schemas
  z
};
