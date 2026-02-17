/**
 * xiaoshazi JWT Authentication Utilities
 * TypeScript version with full type definitions
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET || 'xiaoshazi-jwt-secret-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'xiaoshazi-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY: jwt.SignOptions['expiresIn'] = '15m';
const REFRESH_TOKEN_EXPIRY: jwt.SignOptions['expiresIn'] = '7d';

// Types
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

export interface VerificationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * Generate Access Token
 * @param payload - User data to encode
 * @returns JWT token string
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
}

/**
 * Generate Refresh Token
 * @param payload - User data to encode
 * @returns JWT token string
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
}

/**
 * Generate complete token pair
 * @param user - User object
 * @returns TokenPair with access and refresh tokens
 */
export function generateTokens(user: { id: number; email: string; role?: string }): TokenPair {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  };
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

/**
 * Verify Access Token (async)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    return await jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Access token verification failed:', errorMessage);
    return null;
  }
}

/**
 * Verify Refresh Token (async)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    return await jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Refresh token verification failed:', errorMessage);
    return null;
  }
}

/**
 * Verify Access Token (sync)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessTokenSync(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify Refresh Token (sync)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshTokenSync(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 * @param password - Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Decode token without verification
 * @param token - JWT token string
 * @returns Decoded payload or null if decode fails
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 * @param token - JWT token string
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  return decoded.exp * 1000 < Date.now();
}

/**
 * Get token expiration date
 * @param token - JWT token string
 * @returns Date object or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

// Export configuration constants
export {
  JWT_SECRET,
  REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};

export default {
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
  isTokenExpired,
  getTokenExpiration,
  JWT_SECRET,
  REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
