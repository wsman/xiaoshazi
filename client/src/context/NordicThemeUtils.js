/**
 * Nordic Theme Utilities - 北欧主题工具函数
 * ============================================================
 * 来源: Negentropy-Lab 项目
 * 提供与北欧主题相关的纯工具函数，避免React Fast Refresh警告
 * 
 * 宪法依据: §103 单一真理源 (工具函数与组件逻辑分离)
 * 版本: 1.0.0
 * ============================================================
 */

/**
 * @typedef {'light' | 'dark' | 'auto'} NordicThemeMode
 */

/**
 * 从本地存储读取初始主题模式
 * 
 * @param {NordicThemeMode} [defaultMode='light']
 * @param {string} [storageKey='nordic-theme-mode']
 * @returns {NordicThemeMode}
 */
export const getInitialMode = (
  defaultMode = 'light',
  storageKey = 'nordic-theme-mode'
) => {
  if (typeof window === 'undefined') return defaultMode;
  
  const stored = localStorage.getItem(storageKey);
  if (stored && ['light', 'dark', 'auto'].includes(stored)) {
    return stored;
  }
  return defaultMode;
};

/**
 * 获取当前系统主题偏好
 * 
 * @returns {'light' | 'dark'}
 */
export const getSystemPreference = () => {
  if (typeof window === 'undefined') return 'light';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

/**
 * 创建系统偏好变化监听器
 * 
 * @param {function('light' | 'dark'): void} callback
 * @returns {function(): void} 清理函数
 */
export const createSystemPreferenceListener = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e) => {
    callback(e.matches ? 'dark' : 'light');
  };

  // 初始化
  handleChange(mediaQuery);

  // 监听变化
  mediaQuery.addEventListener('change', handleChange);
  
  return () => mediaQuery.removeEventListener('change', handleChange);
};

/**
 * 根据模式解析实际主题
 * 
 * @param {NordicThemeMode} mode
 * @param {'light' | 'dark'} systemPreference
 * @returns {'light' | 'dark'}
 */
export const resolveTheme = (mode, systemPreference) => {
  return mode === 'auto' ? systemPreference : mode;
};

/**
 * 计算主题类名
 * 
 * @param {'light' | 'dark'} theme
 * @returns {string}
 */
export const getThemeClass = (theme) => {
  return `nordic-theme theme-nordic-${theme}`;
};

/**
 * 应用主题到document元素
 * 
 * @param {'light' | 'dark'} theme
 */
export const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // 移除旧主题类
  root.classList.remove('theme-nordic-light', 'theme-nordic-dark');
  
  // 添加新主题类
  root.classList.add('nordic-theme', `theme-nordic-${theme}`);
  
  // 设置data属性 (用于CSS选择器)
  root.setAttribute('data-theme', theme);
  
  // 更新meta theme-color (移动端浏览器地址栏颜色)
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#1A1D20' : '#FAFBFC'
    );
  }
};

/**
 * 初始化主题过渡动画
 * 首次加载时禁用过渡动画，短暂延迟后启用
 */
export const initializeThemeTransitions = () => {
  if (typeof document === 'undefined') return () => {};

  const root = document.documentElement;
  root.classList.add('nordic-theme-no-transition');
  
  // 短暂延迟后启用过渡
  const timer = setTimeout(() => {
    root.classList.remove('nordic-theme-no-transition');
  }, 100);

  return () => clearTimeout(timer);
};

/**
 * 保存主题模式到本地存储
 * 
 * @param {NordicThemeMode} mode
 * @param {string} [storageKey='nordic-theme-mode']
 */
export const saveThemeMode = (mode, storageKey = 'nordic-theme-mode') => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, mode);
};

/**
 * 根据当前主题计算切换后的主题
 * 
 * @param {'light' | 'dark'} currentTheme
 * @returns {NordicThemeMode}
 */
export const getNextThemeMode = (currentTheme) => {
  return currentTheme === 'light' ? 'dark' : 'light';
};

export default {
  getInitialMode,
  getSystemPreference,
  createSystemPreferenceListener,
  resolveTheme,
  getThemeClass,
  applyThemeToDocument,
  initializeThemeTransitions,
  saveThemeMode,
  getNextThemeMode,
};
