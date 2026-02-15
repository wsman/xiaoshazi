import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 样式统一: 使用 nordic-minimal.css 主题变量
// 圆角: var(--radius-md) = 0.5rem (8px)
// 边框: var(--border-primary)
// 背景: var(--bg-elevated), var(--bg-tertiary)
// 文字: var(--text-primary), var(--text-secondary)

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
 * 样式统一: 使用 nordic-minimal.css 主题变量
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
  
  // 基础样式类名 - 使用 nordic-minimal.css 主题变量
  const baseClass = 'btn inline-flex items-center justify-center gap-2 font-semibold tracking-wide border rounded-[var(--radius-md)] cursor-pointer relative overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--accent-primary)] select-none';
  
  // 变体样式 - 使用 nordic-minimal.css 主题变量
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--nordic-fjord)] text-white border-transparent shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:from-[var(--accent-hover)] hover:to-[var(--nordic-fjord-hover)]',
    secondary: 'bg-[var(--bg-tertiary)]/50 text-[var(--text-secondary)] border-[var(--border-primary)] backdrop-blur-sm hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] hover:shadow-[var(--shadow-md)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
    danger: 'bg-gradient-to-r from-[var(--status-error)] to-[var(--nordic-aurora-rose)] text-white border-transparent shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
  };
  
  // 尺寸样式 - 使用 nordic-minimal.css 变量
  const sizeClasses = {
    sm: 'h-8 px-4 text-xs uppercase', // 小尺寸适合紧凑布局
    md: 'h-10 px-6 text-sm',           // 标准尺寸
    lg: 'h-12 px-8 text-base',         // 大尺寸强调
  };
  
  // 状态样式
  const stateClasses = disabled ? 'opacity-50 cursor-not-allowed grayscale' : '';
  const activeClasses = active ? 'ring-2 ring-[var(--accent-primary)] ring-offset-1 ring-offset-[var(--bg-primary)]' : '';
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
  
  const spacingClass = spacing === 0 ? '' : spacing === 1 ? 'gap-1' : spacing === 2 ? 'gap-2' : spacing === 3 ? 'gap-3' : spacing === 4 ? 'gap-4' : 'gap-2';
  
  return (
    <div className={`flex items-center ${connected ? 'space-x-0' : spacingClass} ${className}`}>
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