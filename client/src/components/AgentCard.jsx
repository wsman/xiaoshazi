/**
 * 🧩 AgentCard 组件 (适配 xiaoshazi 项目)
 * 
 * 从 MY-DOGE-MACRO/Negentropy-Lab 移植
 * 适配 xiaoshazi 数据结构
 * 
 * 样式统一: 使用 nordic-minimal.css 主题变量
 * - 圆角: var(--radius-lg) = 0.75rem (12px)
 * - 边框: var(--border-primary)
 * - 背景: var(--bg-elevated)
 * - 文字: var(--text-primary), var(--text-secondary)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

/**
 * AgentCard 组件属性接口
 */
const AgentCard = React.memo(({ 
  agent, 
  icon, 
  className = "", 
  isLarge = false,
  showStatusLabel = true,
  clickable = false,
  onClick,
  onHover
}) => {
  // 兼容 xiaoshazi 数据结构
  // agent 可能包含: id, name/model, role/provider, status, avatar
  const agentName = agent.name || agent.model || 'Unknown Agent';
  const agentRole = agent.role || agent.provider || 'Agent';
  const agentStatus = agent.status || 'idle';
  const agentId = agent.id || '';
  
  // 状态计算
  const isOnline = agentStatus !== 'offline';
  const isActive = agentStatus === 'thinking' || agentStatus === 'speaking' || agentStatus === 'executed';
  const isThinking = agentStatus === 'thinking';
  const isSpeaking = agentStatus === 'speaking';
  
  // 状态颜色映射 - 使用 nordic-minimal.css 主题变量
  const getStatusColor = () => {
    switch (agentStatus) {
      case 'thinking':
        return { bg: 'bg-[var(--status-info)]', text: 'text-[var(--status-info)]', pulse: 'bg-[var(--status-info)]' };
      case 'speaking':
        return { bg: 'bg-[var(--accent-primary)]', text: 'text-[var(--accent-primary)]', pulse: 'bg-[var(--accent-primary)]' };
      case 'executed':
        return { bg: 'bg-[var(--status-success)]', text: 'text-[var(--status-success)]', pulse: 'bg-[var(--status-success)]' };
      case 'offline':
        return { bg: 'bg-[var(--nordic-cloud)]', text: 'text-[var(--text-tertiary)]', pulse: 'bg-[var(--nordic-cloud)]' };
      default: // idle
        return { bg: 'bg-[var(--status-success)]/30', text: 'text-[var(--status-success)]', pulse: 'bg-[var(--status-success)]' };
    }
  };

  const statusColor = getStatusColor();

  // 事件处理
  const handleClick = () => {
    if (clickable && onClick) {
      onClick(agent);
    }
  };

  const handleHover = () => {
    if (onHover) {
      onHover(agent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        y: -5, 
        boxShadow: "var(--shadow-md)",
        transition: { duration: 0.2 }
      }}
      onClick={handleClick}
      onMouseEnter={handleHover}
      className={`
        relative overflow-hidden
        ${isLarge ? 'w-64 p-6' : 'w-48 p-4'} 
        bg-[var(--bg-elevated)] 
        border border-[var(--border-primary)] 
        rounded-[var(--radius-lg)]
        shadow-[var(--shadow-xs)]
        dark:shadow-none
        flex flex-col items-center gap-3
        transition-all duration-300
        ${clickable ? 'cursor-pointer hover:border-[var(--accent-primary)]' : 'cursor-default'}
        ${className}
      `}
    >
      {/* 状态指示器和标签 */}
      {showStatusLabel && (
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
            {agentStatus}
          </span>
          <div className="relative flex h-2 w-2">
            {isActive && (
              <span 
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColor.pulse} opacity-75`}
              ></span>
            )}
            <span 
              className={`relative inline-flex rounded-full h-2 w-2 ${statusColor.bg}`}
            ></span>
          </div>
        </div>
      )}

      {/* 头像/图标区域 */}
      <div className={`
        ${isLarge ? 'w-24 h-24' : 'w-16 h-16'}
        rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
        flex items-center justify-center text-[var(--text-tertiary)] relative
        shadow-[var(--shadow-inset)]
      `}>
        {/* 自定义图标或默认User图标 */}
        {icon || (
          <User 
            size={isLarge ? 48 : 32} 
            strokeWidth={1.2} 
            className={isActive ? 'text-[var(--status-success)]' : ''}
          />
        )}
        
        {/* 活动状态的装饰环 */}
        <div className={`
          absolute inset-0 rounded-full border border-[var(--border-primary)] scale-110 
          ${isActive ? 'animate-pulse border-[var(--status-success)]/30' : ''}
        `} />
        
        {/* 特定状态的额外指示器 */}
        {isThinking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--status-info)]/20 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--status-info)]"></div>
          </motion.div>
        )}
        
        {isSpeaking && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></div>
          </motion.div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="text-center z-10 w-full">
        <h3 className={`
          ${isLarge ? 'text-xl' : 'text-sm'} 
          font-medium text-[var(--text-primary)] truncate tracking-tight
        `}>
          {agentName}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="h-[1px] w-4 bg-[var(--border-primary)]" />
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.2em] font-medium">
            {agentRole}
          </p>
          <div className="h-[1px] w-4 bg-[var(--border-primary)]" />
        </div>
        
        {/* 状态描述（可选） */}
        {isLarge && (
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {isOnline ? '在线' : '离线'} • {getStatusDescription(agentStatus)}
          </p>
        )}
      </div>

      {/* 活动状态的高光条 */}
      {isActive && (
        <motion.div 
          layoutId="activeGlow"
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--status-info)]" 
        />
      )}

      {/* Agent ID标签（小尺寸显示） */}
      {!isLarge && agentId && (
        <div className="absolute bottom-2 left-3">
          <span className="text-[8px] text-[var(--text-tertiary)] font-mono opacity-60">
            #{typeof agentId === 'string' ? agentId.substring(0, 8) : agentId}
          </span>
        </div>
      )}
    </motion.div>
  );
});

/**
 * 获取状态描述文本
 */
function getStatusDescription(status) {
  switch (status) {
    case 'idle':
      return '等待任务';
    case 'thinking':
      return '思考中';
    case 'speaking':
      return '对话中';
    case 'executed':
      return '执行完成';
    case 'offline':
      return '离线状态';
    default:
      return status;
  }
}

AgentCard.displayName = 'AgentCard';

export default AgentCard;
