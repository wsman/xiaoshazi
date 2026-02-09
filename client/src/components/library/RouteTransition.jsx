// RouteTransition - 路由过渡动画组件
// 依据: FE-205路由过渡动画实施方案
// 创建: 2026-02-07 (P2阶段优化)

import React, { useEffect, useState, useRef, memo } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteTransition.css';

// 路由历史记录管理器
class RouteHistoryManager {
  constructor() {
    this.history = [window.location.pathname];
    this.maxHistory = 10;
  }

  static getInstance() {
    if (!RouteHistoryManager.instance) {
      RouteHistoryManager.instance = new RouteHistoryManager();
    }
    return RouteHistoryManager.instance;
  }

  addRoute(route) {
    this.history.push(route);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getPreviousRoute() {
    if (this.history.length < 2) {
      return null;
    }
    return this.history[this.history.length - 2];
  }

  getRouteChangeDirection(currentRoute) {
    const previousRoute = this.getPreviousRoute();
    
    if (!previousRoute) {
      return 'forward';
    }
    
    // 简单的路径比较，可以扩展为更复杂的逻辑
    const currentDepth = currentRoute.split('/').length;
    const previousDepth = previousRoute.split('/').length;
    
    if (currentDepth > previousDepth) {
      return 'forward';
    } else if (currentDepth < previousDepth) {
      return 'backward';
    }
    
    return 'forward'; // 默认向前
  }
}

/**
 * 路由过渡动画组件
 * 提供页面切换时的平滑过渡效果
 */
export const RouteTransition = memo(({
  children,
  animationType = 'slide-up',
  duration = 300,
  disabled = false,
}) => {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionDirection, setTransitionDirection] = useState('forward');
  const prevLocationRef = useRef(location);
  const routeHistoryManager = useRef(RouteHistoryManager.getInstance());

  // 根据动画类型和方向获取CSS类名
  const getAnimationClasses = (direction) => {
    const baseClass = 'route-transition';
    const stateClass = isAnimating ? 'route-transition--animating' : 'route-transition--idle';
    const directionClass = `route-transition--${direction}`;
    
    // 动画类型类名
    let animationClass = '';
    if (animationType === 'fade') {
      animationClass = 'route-transition--fade';
    } else if (animationType === 'slide') {
      animationClass = direction === 'forward' 
        ? 'route-transition--slide-left' 
        : 'route-transition--slide-right';
    } else if (animationType === 'slide-up') {
      animationClass = 'route-transition--slide-up';
    } else if (animationType === 'slide-down') {
      animationClass = 'route-transition--slide-down';
    } else if (animationType === 'scale') {
      animationClass = 'route-transition--scale';
    }
    
    return `${baseClass} ${stateClass} ${directionClass} ${animationClass}`.trim();
  };

  // 处理内容更新
  useEffect(() => {
    // 如果路由没有变化，只更新内容
    if (prevLocationRef.current.key === location.key) {
      setDisplayChildren(children);
      return;
    }

    // 更新路由历史
    routeHistoryManager.current.addRoute(location.pathname);
    
    // 确定过渡方向
    const direction = routeHistoryManager.current.getRouteChangeDirection(location.pathname);
    setTransitionDirection(direction);

    // 开始过渡动画
    if (!disabled) {
      setIsAnimating(true);
      
      // 设置动画时长后更新子组件
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsAnimating(false);
      }, duration);

      // 立即显示新内容，但应用动画样式
      setDisplayChildren(children);

      // 更新前一个位置引用
      prevLocationRef.current = location;

      return () => clearTimeout(timer);
    } else {
      // 禁用动画时直接更新
      setDisplayChildren(children);
      prevLocationRef.current = location;
    }
  }, [location.key, location.pathname, children, duration, disabled]);

  // 如果禁用动画，直接渲染子组件
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={getAnimationClasses(transitionDirection)}
      style={{
        '--transition-duration': `${duration}ms`,
      }}
    >
      <div className="route-transition__container">
        {displayChildren}
      </div>
    </div>
  );
});

RouteTransition.displayName = 'RouteTransition';

/**
 * 路由过渡动画容器组件
 * 用于包装整个路由内容区域
 */
export const RouteTransitionContainer = memo((props) => {
  return (
    <RouteTransition {...props} />
  );
});

/**
 * 高阶组件：为组件添加路由过渡支持
 */
export function withRouteTransition(
  Component,
  options = {}
) {
  const WrappedComponent = (componentProps) => {
    return (
      <RouteTransition {...options}>
        <Component {...componentProps} />
      </RouteTransition>
    );
  };
  
  WrappedComponent.displayName = `WithRouteTransition(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

export default RouteTransition;