/**
 * xiaoshazi Type Definitions
 * Central type declarations for the application
 */

// ==========================================
// Error Types
// ==========================================

export interface AppErrorOptions {
  message: string;
  statusCode: number;
  code: string;
  isOperational?: boolean;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode?: number;
    meta?: Record<string, unknown>;
    stack?: string;
  };
}

// ==========================================
// JWT Types
// ==========================================

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload extends jwt.JwtPayload {
  id: number;
  email: string;
  role: string;
}

// ==========================================
// Agent Types
// ==========================================

export interface Agent {
  id: number;
  rank: number;
  diff: number;
  tier: Tier;
  provider: string;
  model: string;
  avgPerf: number;
  peakPerf: number;
  samples: number;
  scenarios: Scenario[];
}

export interface RankedAgent extends Agent {
  weightedScore: number;
  normalizedScore: number;
}

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';
export type Scenario = 'all' | 'coding' | 'reasoning' | 'creative';

// ==========================================
// API Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// User Types
// ==========================================

export interface User {
  id: number;
  email: string;
  username?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface UserCreateInput {
  email: string;
  password: string;
  username?: string;
}

export interface UserUpdateInput {
  email?: string;
  username?: string;
  role?: UserRole;
}

// ==========================================
// Auth Types
// ==========================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

// ==========================================
// Request/Response Types
// ==========================================

export interface RequestWithUser extends Request {
  user?: TokenPayload;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    redis: boolean;
    database?: boolean;
  };
  version: string;
}

// ==========================================
// Scoring Types
// ==========================================

export interface ScoringOptions {
  scenario?: Scenario;
  normalize?: boolean;
  minSamples?: number;
}

export interface ScoringResult {
  agents: RankedAgent[];
  scenario: Scenario;
  generatedAt: string;
}

// ==========================================
// WebSocket Types
// ==========================================

export interface SocketEvents {
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: Error) => void;
  'ranking:update': (data: RankingUpdate) => void;
  'agent:update': (data: Agent) => void;
}

export interface RankingUpdate {
  agents: RankedAgent[];
  timestamp: string;
}

// ==========================================
// Configuration Types
// ==========================================

export interface ServerConfig {
  port: number;
  env: 'development' | 'production' | 'test';
  cors: {
    origins: string[];
    credentials: boolean;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  redis: {
    url: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file: string;
  };
}

// ==========================================
// External Library Types (for jsonwebtoken)
// ==========================================

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: unknown;
  }
}

// ==========================================
// Global Types
// ==========================================

export {}; // Make this file a module

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      JWT_SECRET: string;
      REFRESH_SECRET: string;
      REDIS_URL: string;
      LOG_FILE: string;
      ALLOWED_ORIGINS: string;
    }
  }
}
