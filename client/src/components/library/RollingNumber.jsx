// RollingNumber Component - 数字滚动动画组件
// 依据: FE-013 数字滚动动画组件实施方案
// 创建: 2026-02-07 (Phase 3: P1视觉与体验增强)

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';

/**
 * RollingNumber - 专业金融级数字滚动动画组件
 * 提供平滑的数字滚动效果，适用于价格显示、计数器等场景
 */
export const RollingNumber = ({
  value,
  formatOptions = {},
  decimals = 0,
  prefix = '',
  suffix = '',
  animate = true,
  duration = 500,
  ease = 'easeOut',
  showDirectionIndicator = false,
  indicatorSize = 'sm',
  className = '',
  onChange,
}) => {
  const [previousValue, setPreviousValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [formattedValue, setFormattedValue] = useState('');
  const animationRef = useRef();
  const containerRef = useRef(null);

  // 动画配置
  const springConfig = useMemo(() => {
    switch (ease) {
      case 'spring':
        return { type: 'spring', stiffness: 100, damping: 15 };
      case 'easeIn':
        return { ease: [0.4, 0, 1, 1] };
      case 'easeOut':
        return { ease: [0, 0, 0.2, 1] };
      case 'easeInOut':
        return { ease: [0.4, 0, 0.2, 1] };
      default:
        return { ease: 'linear' };
    }
  }, [ease]);

  // 使用Framer Motion弹簧动画
  const springValue = useSpring(previousValue, {
    ...springConfig,
    duration: duration / 1000,
  });

  // 格式化数字
  const formatNumber = (num) => {
    const options = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...formatOptions,
    };
    
    return new Intl.NumberFormat('en-US', options).format(num);
  };

  // 数字变化动画
  useEffect(() => {
    if (value === previousValue) return;

    const oldValue = previousValue;
    const newValue = value;
    const increasing = newValue > oldValue;
    
    setIsIncreasing(increasing);
    
    // 回调通知
    if (onChange) {
      onChange(newValue, oldValue);
    }

    if (animate) {
      // 使用requestAnimationFrame进行动画
      let startTime = null;
      
      const animateValue = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        let easedProgress = progress;
        if (ease === 'easeIn') {
          easedProgress = progress * progress * progress;
        } else if (ease === 'easeOut') {
          easedProgress = 1 - Math.pow(1 - progress, 3);
        } else if (ease === 'easeInOut') {
          easedProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
        
        const currentValue = oldValue + (newValue - oldValue) * easedProgress;
        springValue.set(currentValue);
        
        // 更新格式化的显示值
        const formatted = `${prefix}${formatNumber(currentValue)}${suffix}`;
        setFormattedValue(formatted);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateValue);
        } else {
          // 动画完成，确保最终值准确
          springValue.set(newValue);
          const finalFormatted = `${prefix}${formatNumber(newValue)}${suffix}`;
          setFormattedValue(finalFormatted);
          setPreviousValue(newValue);
        }
      };
      
      // 取消任何现有的动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // 开始新动画
      animationRef.current = requestAnimationFrame(animateValue);
    } else {
      // 不使用动画，直接更新值
      springValue.set(newValue);
      const finalFormatted = `${prefix}${formatNumber(newValue)}${suffix}`;
      setFormattedValue(finalFormatted);
      setPreviousValue(newValue);
    }
    
    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animate, duration, ease, prefix, suffix, springValue, onChange, previousValue]); // removed formatNumber from deps as it's not a state

  // 初始化格式化值
  useEffect(() => {
    const formatted = `${prefix}${formatNumber(value)}${suffix}`;
    setFormattedValue(formatted);
    setPreviousValue(value);
  }, [value, prefix, suffix, decimals]);

  // 变化指示器
  const DirectionIndicator = () => {
    if (!showDirectionIndicator || value === previousValue) {
      return null;
    }
    
    const indicatorClass = `ml-1 text-${indicatorSize === 'sm' ? 'xs' : indicatorSize === 'md' ? 'sm' : 'base'} ${
      isIncreasing ? 'text-green-500' : 'text-red-500'
    }`;
    
    return (
      <motion.div
        className={indicatorClass}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isIncreasing ? '↑' : '↓'}
      </motion.div>
    );
  };

  // 字符动画效果（逐字符变化）
  const renderAnimatedCharacters = () => {
    if (!formattedValue) return null;
    
    return (
      <div className="flex items-baseline">
        {formattedValue.split('').map((char, index) => {
          const isDigit = /[0-9]/.test(char);
          
          if (isDigit) {
            return (
              <motion.div
                key={`char-${index}`}
                className="relative"
                initial={{ y: isIncreasing ? 10 : -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
              >
                {char}
              </motion.div>
            );
          }
          
          return (
            <span key={`char-${index}`}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`inline-flex ${className}`}
    >
      <AnimatePresence mode="wait">
        <div className="flex items-center">
          {animate && value !== previousValue ? (
            renderAnimatedCharacters()
          ) : (
            <div>{formattedValue}</div>
          )}
          <DirectionIndicator />
        </div>
      </AnimatePresence>
    </div>
  );
};

export default RollingNumber;