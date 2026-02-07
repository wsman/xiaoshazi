import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Inlined buttonRippleVariants
const buttonRippleVariants = {
  initial: {
    scale: 0,
    opacity: 1,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * MotionButton - 增强版按钮组件
 * 提供Framer Motion驱动的流畅动画效果
 */
export const MotionButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  active = false,
  onClick,
  showRipple = true,
  showHover = true,
  showTap = true,
  className = '',
  fullWidth = false,
}) => {
  const [ripples, setRipples] = useState([]);
  
  // 基础样式类名 - 优化排版和视觉
  const baseClass = 'btn inline-flex items-center justify-center gap-2 font-semibold tracking-wide border rounded-lg cursor-pointer relative overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 select-none';
  
  // 变体样式 - 适配 AgentStats 暗色主题，增强对比度和层级
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/40 hover:from-blue-500 hover:to-indigo-500',
    secondary: 'bg-gray-800/50 text-gray-400 border-gray-700/50 backdrop-blur-sm hover:bg-gray-700/80 hover:text-white hover:border-gray-600 hover:shadow-md',
    ghost: 'bg-transparent text-gray-400 border-transparent hover:bg-gray-800/50 hover:text-white',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-transparent shadow-md shadow-red-900/20 hover:shadow-lg hover:shadow-red-900/40',
  };
  
  // 尺寸样式 - 增加内边距提升呼吸感
  const sizeClasses = {
    sm: 'h-8 px-4 text-xs uppercase', // 小尺寸适合紧凑布局
    md: 'h-10 px-6 text-sm',           // 标准尺寸
    lg: 'h-12 px-8 text-base',         // 大尺寸强调
  };
  
  // 状态样式
  const stateClasses = disabled ? 'opacity-50 cursor-not-allowed grayscale' : '';
  const activeClasses = active ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-900' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClass = `${baseClass} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size]} ${stateClasses} ${activeClasses} ${widthClass} ${className}`.trim();
  
  // 处理点击事件
  const handleClick = (event) => {
    if (disabled || loading) return;
    
    // 添加涟漪效果
    if (showRipple) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = { x, y, id: Date.now() };
      setRipples(prev => [...prev, newRipple]);
      
      // 3秒后移除涟漪
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
    
    // 执行点击回调
    if (onClick) onClick(event);
  };
  
  // 悬停动画配置
  const hoverAnimation = showHover ? {
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  } : {};
  
  // 点击动画配置
  const tapAnimation = showTap ? {
    scale: 0.98,
  } : {};
  
  return (
    <motion.button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : hoverAnimation}
      whileTap={disabled || loading ? undefined : tapAnimation}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      }}
    >
      {/* 涟漪效果 */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            variants={buttonRippleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        ))}
      </AnimatePresence>
      
      {/* 加载状态 */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-inherit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      )}
      
      {/* 按钮内容 */}
      <div className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </motion.button>
  );
};

/**
 * MotionIconButton - 图标按钮版本
 */
export const MotionIconButton = ({
  icon,
  label,
  ...props
}) => {
  return (
    <MotionButton {...props}>
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ rotate: 15 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {icon}
        </motion.div>
        {label && <span>{label}</span>}
      </div>
    </MotionButton>
  );
};

/**
 * MotionButtonGroup - 按钮组
 */
export const MotionButtonGroup = ({
  children,
  spacing = 2,
  connected = false,
  className = '',
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={`flex items-center ${connected ? 'space-x-0' : `gap-${spacing}`} ${className}`}>
      {childrenArray.map((child, index) => {
        if (React.isValidElement(child)) {
          let childClassName = child.props.className || '';
          
          if (connected) {
             if (index > 0) childClassName += ' rounded-l-none border-l-0';
             if (index < childrenArray.length - 1) childClassName += ' rounded-r-none';
          }
          
          return React.cloneElement(child, {
            className: childClassName,
          });
        }
        return child;
      })}
    </div>
  );
};

export default MotionButton;