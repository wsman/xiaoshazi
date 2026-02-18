const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '小沙子 API',
      version: '1.0.0',
      description: '小沙子 HTTPS 测试网站 API 文档\n\n## 认证说明\n\n本 API 使用 JWT (JSON Web Token) 进行认证。\n\n### 获取 Token\n\n1. **登录** - POST /api/auth/login 获取 accessToken 和 refreshToken\n2. **注册** - POST /api/auth/register 创建新账户\n\n### 使用 Token\n\n在请求头中添加 Authorization：\n```\nAuthorization: Bearer <your_access_token>\n```\n\n### Token 刷新\n\n当 accessToken 过期时，使用 refreshToken 获取新令牌：\n- POST /api/auth/refresh\n\n### 测试账号\n- 邮箱: admin@xiaoshazi.com\n- 密码: admin123',
      contact: {
        name: 'API Support',
        email: 'support@xiaoshazi.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:14514',
        description: '开发服务器'
      },
      {
        url: 'https://localhost:443',
        description: '生产服务器 (HTTPS)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 访问令牌'
        },
        RefreshToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Refresh-Token',
          description: '刷新令牌'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            message: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '1'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@xiaoshazi.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'admin'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expiresIn: {
              type: 'integer',
              example: 900
            }
          }
        },
        Agent: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            rank: {
              type: 'integer',
              example: 1
            },
            diff: {
              type: 'integer',
              example: 0
            },
            tier: {
              type: 'string',
              enum: ['S', 'A', 'B', 'C', 'D'],
              example: 'S'
            },
            provider: {
              type: 'string',
              example: 'Anthropic'
            },
            model: {
              type: 'string',
              example: 'Claude 3.5 Sonnet'
            },
            avgPerf: {
              type: 'number',
              example: 88.5
            },
            peakPerf: {
              type: 'number',
              example: 94.2
            },
            samples: {
              type: 'integer',
              example: 15420
            },
            scenarios: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['coding', 'reasoning', 'creative']
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              example: 'healthy'
            },
            uptime: {
              type: 'number',
              example: 3600
            },
            timestamp: {
              type: 'integer',
              example: 1705488000000
            }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            action: {
              type: 'string'
            },
            userId: {
              type: 'string'
            },
            email: {
              type: 'string'
            },
            ip: {
              type: 'string'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            details: {
              type: 'object'
            }
          }
        },
        EntropyData: {
          type: 'object',
          properties: {
            entropy: {
              type: 'number'
            },
            timestamp: {
              type: 'integer'
            },
            factors: {
              type: 'object'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: '认证',
        description: '用户认证相关接口'
      },
      {
        name: '健康检查',
        description: '系统健康状态接口'
      },
      {
        name: '智能体',
        description: 'AI 智能体排名和性能数据'
      },
      {
        name: '审计',
        description: '系统审计日志'
      },
      {
        name: '熵值',
        description: '系统熵值计算'
      },
      {
        name: '系统',
        description: '系统信息接口'
      }
    ]
  },
  apis: ['./server.js', './server/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
