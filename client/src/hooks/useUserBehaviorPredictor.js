// useUserBehaviorPredictor.js
// Mission: 预测用户意图，消除感知网络延迟，实现即时内容切换
// 基于 UserBehaviorPredictor 模式设计

import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import ChartWorkerManager from '../utils/ChartWorkerManager';

// 简单缓存预取结果 (Map<Scenario, Data>)
const PREFETCH_CACHE = new Map();

// 用户行为模式识别配置
const BEHAVIOR_PATTERNS = {
  hover: {
    delay: 80,          // Hover 触发延迟 (ms)
    cancelDelay: 150,   // 快速移出取消延迟
  },
  preclick: {
    probability: 0.7,   // 预判概率阈值
    lookAhead: 2,       // 预取接下来N个场景
  }
};

/**
 * useUserBehaviorPredictor
 * 
 * 预测用户意图并预加载内容，消除感知延迟
 * - 监听 hover intent (80ms 延迟确认)
 * - 预取场景数据和预处理
 * - 智能缓存管理
 * 
 * @param {Object} options
 * @param {string} options.baseUrl - API 基础 URL
 * @param {number} options.hoverDelay - hover 触发延迟 (默认 80ms)
 * @param {Function} options.onPrefetchStart - 预取开始回调
 * @param {Function} options.onPrefetchComplete - 预取完成回调
 * @param {Function} options.onPrefetchError - 预取错误回调
 * 
 * @returns {Object} API
 */
export function useUserBehaviorPredictor({
  baseUrl,
  hoverDelay = BEHAVIOR_PATTERNS.hover.delay,
  onPrefetchStart,
  onPrefetchComplete,
  onPrefetchError,
} = {}) {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchedScenarios, setPrefetchedScenarios] = useState(new Set());
  
  const activeRequests = useRef(new Set());
  const hoverTimers = useRef(new Map());
  const hoverStartTimes = useRef(new Map());
  
  // 清理函数
  useEffect(() => {
    return () => {
      // 清理所有计时器
      hoverTimers.current.forEach(timer => clearTimeout(timer));
      hoverTimers.current.clear();
    };
  }, []);

  /**
   * 预取单个场景数据
   * @param {string} scenario - 场景 ID
   */
  const prefetchScenario = useCallback(async (scenario) => {
    // 跳过已缓存或正在请求的场景
    if (PREFETCH_CACHE.has(scenario) || activeRequests.current.has(scenario)) {
      return;
    }

    // 跳过 'all' 场景
    if (!scenario || scenario === 'all') return;

    activeRequests.current.add(scenario);
    setIsPrefetching(true);

    if (onPrefetchStart) {
      onPrefetchStart(scenario);
    }

    try {
      // Step 1: 获取原始数据
      const url = `${baseUrl}/api/agents?scenario=${scenario}`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'X-Prefetch': 'true' }
      });
      
      if (response.data.success) {
        const rawData = response.data.data;
        
        // Step 2: 使用 Worker 处理数据（预计算）
        const processedData = await ChartWorkerManager.processData(rawData, scenario);
        
        // Step 3: 缓存结果
        PREFETCH_CACHE.set(scenario, {
          data: processedData,
          timestamp: Date.now()
        });
        
        // 更新已预取场景状态
        setPrefetchedScenarios(prev => new Set([...prev, scenario]));
        
        console.log(`[UserBehaviorPredictor] Prefetched scenario: ${scenario}`);
        
        if (onPrefetchComplete) {
          onPrefetchComplete(scenario, processedData);
        }
      }
    } catch (error) {
      console.error(`[UserBehaviorPredictor] Prefetch failed for ${scenario}:`, error);
      if (onPrefetchError) {
        onPrefetchError(scenario, error);
      }
    } finally {
      activeRequests.current.delete(scenario);
      setIsPrefetching(activeRequests.current.size > 0);
    }
  }, [baseUrl, onPrefetchStart, onPrefetchComplete, onPrefetchError]);

  /**
   * 处理鼠标进入事件 - 开始 hover intent 检测
   * @param {string} scenario - 场景 ID
   */
  const handleMouseEnter = useCallback((scenario) => {
    // 记录 hover 开始时间
    hoverStartTimes.current.set(scenario, Date.now());
    
    // 清除该场景已有的计时器
    if (hoverTimers.current.has(scenario)) {
      clearTimeout(hoverTimers.current.get(scenario));
    }

    // 如果已经缓存，不触发预取
    if (PREFETCH_CACHE.has(scenario) || activeRequests.current.has(scenario)) {
      return;
    }

    // 启动 80ms 延迟计时器
    const timer = setTimeout(() => {
      // 计算实际 hover 时长
      const hoverDuration = hoverStartTimes.current.get(scenario)
        ? Date.now() - hoverStartTimes.current.get(scenario)
        : 0;
      
      // 只有 hover 时间 >= 80ms 才触发预取
      if (hoverDuration >= hoverDelay) {
        prefetchScenario(scenario);
      }
      
      hoverTimers.current.delete(scenario);
    }, hoverDelay);

    hoverTimers.current.set(scenario, timer);
  }, [prefetchScenario, hoverDelay]);

  /**
   * 处理鼠标离开事件 - 取消未触发的预取
   * @param {string} scenario - 场景 ID
   */
  const handleMouseLeave = useCallback((scenario) => {
    // 清除 hover 计时器
    if (hoverTimers.current.has(scenario)) {
      clearTimeout(hoverTimers.current.get(scenario));
      hoverTimers.current.delete(scenario);
    }
    
    // 清理开始时间记录
    hoverStartTimes.current.delete(scenario);
  }, []);

  /**
   * 获取缓存的结果
   * @param {string} scenario - 场景 ID
   * @returns {Object|null} 缓存的数据或 null
   */
  const getCachedResult = useCallback((scenario) => {
    const cached = PREFETCH_CACHE.get(scenario);
    // 缓存有效期 5 分钟
    if (cached && (Date.now() - cached.timestamp < 300000)) {
      return cached.data;
    }
    return null;
  }, []);

  /**
   * 检查场景是否已预取
   * @param {string} scenario - 场景 ID
   * @returns {boolean}
   */
  const isPrefetched = useCallback((scenario) => {
    return PREFETCH_CACHE.has(scenario);
  }, []);

  /**
   * 预取多个场景（用于预测性预加载）
   * @param {string[]} scenarios - 场景 ID 数组
   */
  const prefetchMultiple = useCallback((scenarios) => {
    scenarios.forEach(scenario => {
      if (scenario && scenario !== 'all' && !PREFETCH_CACHE.has(scenario)) {
        prefetchScenario(scenario);
      }
    });
  }, [prefetchScenario]);

  /**
   * 清除所有缓存
   */
  const clearCache = useCallback(() => {
    PREFETCH_CACHE.clear();
    setPrefetchedScenarios(new Set());
  }, []);

  /**
   * 清除单个场景缓存
   * @param {string} scenario - 场景 ID
   */
  const clearScenarioCache = useCallback((scenario) => {
    PREFETCH_CACHE.delete(scenario);
    setPrefetchedScenarios(prev => {
      const next = new Set(prev);
      next.delete(scenario);
      return next;
    });
  }, []);

  return {
    // 事件处理器
    handleMouseEnter,
    handleMouseLeave,
    
    // 数据获取
    getCachedResult,
    prefetchScenario,
    prefetchMultiple,
    
    // 状态查询
    isPrefetched,
    isPrefetching,
    prefetchedScenarios: Array.from(prefetchedScenarios),
    
    // 缓存管理
    clearCache,
    clearScenarioCache,
    
    // 配置
    config: {
      hoverDelay,
      patterns: BEHAVIOR_PATTERNS
    }
  };
}

/**
 * useHoverIntent - 独立的 Hover Intent 检测 Hook
 * 用于任何需要 hover intent 延迟确认的场景
 * 
 * @param {Object} options
 * @param {number} options.delay - 延迟时间 (ms)
 * @param {Function} options.onIntentConfirmed - intent 确认回调
 * @param {Function} options.onIntentCancelled - intent 取消回调
 * @returns {Object} handlers and state
 */
export function useHoverIntent({
  delay = 80,
  onIntentConfirmed,
  onIntentCancelled,
} = {}) {
  const [isIntentConfirmed, setIsIntentConfirmed] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback((event) => {
    startTimeRef.current = Date.now();
    setIsIntentConfirmed(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsIntentConfirmed(true);
      if (onIntentConfirmed) {
        onIntentConfirmed(event);
      }
    }, delay);
  }, [delay, onIntentConfirmed]);

  const handleMouseLeave = useCallback((event) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    setIsIntentConfirmed(false);

    if (onIntentCancelled && duration < delay) {
      onIntentCancelled(event, duration);
    }

    startTimeRef.current = null;
  }, [delay, onIntentCancelled]);

  return {
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    handleMouseEnter,
    handleMouseLeave,
    isIntentConfirmed,
  };
}

export default useUserBehaviorPredictor;
