import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:14514';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Token 存储键名
const TOKEN_KEY = 'xiaoshazi_access_token';
const REFRESH_TOKEN_KEY = 'xiaoshazi_refresh_token';

/**
 * 获取 Access Token
 * @returns {string|null}
 */
function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 获取 Refresh Token
 * @returns {string|null}
 */
function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 存储 Token
 * @param {string} accessToken
 * @param {string} refreshToken
 */
function setTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * 清除 Token
 */
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// 请求拦截器 - 自动添加 Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 Token 刷新
let isRefreshing = false;
let refreshSubscribers = [];

// 订阅 token 刷新
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// 通知所有订阅者
function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// 刷新 Token
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
      refreshToken
    });
    
    if (response.data.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      setTokens(accessToken, newRefreshToken);
      return accessToken;
    }
    
    throw new Error('Token refresh failed');
  } catch (error) {
    clearTokens();
    throw error;
  }
}

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是 401 错误且不是刷新 token 请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 已经在刷新 token，等待刷新完成后重试
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        onTokenRefreshed(newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除 token 并跳转到登录页
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// 扩展 api 实例方法
export default {
  // GET 请求
  get: (url, config = {}) => api.get(url, config),
  
  // POST 请求
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT 请求
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // DELETE 请求
  delete: (url, config = {}) => api.delete(url, config),
  
  // PATCH 请求
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // 设置 Token
  setTokens,
  
  // 清除 Token
  clearTokens,
  
  // 获取 Token
  getAccessToken,
  getRefreshToken,
  
  // 导出原始 axios 实例
  axios: api
};

// 导出 axios 实例供直接使用
export { api };
