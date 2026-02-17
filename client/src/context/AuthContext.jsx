import { createContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'xiaoshazi_access_token';
const REFRESH_TOKEN_KEY = 'xiaoshazi_refresh_token';
const USER_KEY = 'xiaoshazi_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化时从 localStorage 恢复状态
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          // 验证 token 是否有效
          const response = await api.post('/auth/verify', { token: storedToken });
          
          if (response.data.valid) {
            setUser(JSON.parse(storedUser));
          } else {
            // token 无效，尝试刷新
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              await refreshAccessToken(refreshToken);
            } else {
              clearAuthData();
            }
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
          clearAuthData();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 清除认证数据
  const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setError(null);
  };

  // 刷新 Access Token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        
        // 重新获取用户信息
        const userResponse = await api.get('/auth/me');
        if (userResponse.data.success) {
          setUser(userResponse.data.data);
          localStorage.setItem(USER_KEY, JSON.stringify(userResponse.data.data));
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      clearAuthData();
      return false;
    }
  };

  // 登录
  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: userData, accessToken, refreshToken } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        
        setUser(userData);
        setIsLoading(false);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 注册
  const register = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/register', { email, password });
      
      if (response.data.success) {
        const { user: userData, accessToken, refreshToken } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        
        setUser(userData);
        setIsLoading(false);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuthData();
    }
  }, []);

  // 更新用户信息
  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
