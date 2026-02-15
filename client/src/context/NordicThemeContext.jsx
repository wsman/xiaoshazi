/**
 * Nordic Theme Context - 主题状态管理
 * ============================================================
 * 来源: Negentropy-Lab 项目
 * 提供 React Context 用于管理北欧主题状态
 * 
 * 宪法依据: §103 单一真理源 (主题状态集中管理)
 * 版本: 1.0.0
 * ============================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getInitialMode,
  createSystemPreferenceListener,
  resolveTheme,
  getThemeClass,
  applyThemeToDocument,
  initializeThemeTransitions,
  saveThemeMode,
  getNextThemeMode,
} from './NordicThemeUtils';

// 存储键名
const THEME_STORAGE_KEY = 'nordic-theme-mode';

// 创建上下文
const NordicThemeContext = createContext(undefined);

/**
 * NordicThemeProvider - 北欧主题提供者
 * 包裹应用根组件以启用主题切换功能
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.defaultMode='light']
 * @param {string} [props.storageKey=THEME_STORAGE_KEY]
 */
export const NordicThemeProvider = ({
  children,
  defaultMode = 'light',
  storageKey = THEME_STORAGE_KEY,
}) => {
  // 从本地存储读取初始值
  const initialMode = getInitialMode(defaultMode, storageKey);
  const [mode, setModeState] = useState(initialMode);
  const [systemPreference, setSystemPreference] = useState('light');

  // 监听系统偏好变化
  useEffect(() => {
    const cleanup = createSystemPreferenceListener((preference) => {
      setSystemPreference(preference);
    });
    return cleanup;
  }, []);

  // 解析实际主题
  const resolvedTheme = resolveTheme(mode, systemPreference);

  // 计算主题类名
  const themeClass = getThemeClass(resolvedTheme);

  // 设置主题模式
  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    saveThemeMode(newMode, storageKey);
  }, [storageKey]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const nextMode = getNextThemeMode(resolvedTheme);
    setMode(nextMode);
  }, [resolvedTheme, setMode]);

  // 应用主题到 document
  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  // 首次加载时禁用过渡动画
  useEffect(() => {
    const cleanup = initializeThemeTransitions();
    return cleanup;
  }, []);

  const value = {
    mode,
    resolvedTheme,
    setMode,
    toggleTheme,
    themeClass,
  };

  return (
    <NordicThemeContext.Provider value={value}>
      {children}
    </NordicThemeContext.Provider>
  );
};

/**
 * useNordicTheme - 获取北欧主题上下文
 * 必须在 NordicThemeProvider 内部使用
 */
export const useNordicTheme = () => {
  const context = useContext(NordicThemeContext);
  
  if (context === undefined) {
    throw new Error('useNordicTheme must be used within a NordicThemeProvider');
  }
  
  return context;
};

export default NordicThemeProvider;
