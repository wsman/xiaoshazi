import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * 认证 Hook
 * @returns {Object} 认证相关的状态和方法
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * 检查用户是否已认证
 * @returns {boolean}
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return !isLoading && isAuthenticated;
}

/**
 * 获取当前用户
 * @returns {Object|null}
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * 检查用户角色
 * @param {string|string[]} roles - 要检查的角色
 * @returns {boolean}
 */
export function useHasRole(...roles) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userRole = user.role;
  const allowedRoles = roles.flat();
  
  return allowedRoles.includes(userRole);
}

/**
 * 需要特定角色的保护组件
 * @param {string|string[]} requiredRoles - 必需的角色
 * @param {React.ReactNode} children - 子组件
 * @returns {React.ReactNode}
 */
export function RequireRole({ roles, children }) {
  const hasRole = useHasRole(roles);
  
  if (!hasRole) {
    return null;
  }
  
  return children;
}

export default useAuth;
