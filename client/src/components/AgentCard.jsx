import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

/**
 * 🧩 AgentCard 组件 (适配 xiaoshazi 项目)
 * 
 * 从 MY-DOGE-MACRO/Negentropy-Lab 移植
 * 适配 xiaoshazi 数据结构
 */

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
  
  // 状态颜色映射
  const getStatusColor = () => {
    switch (agentStatus) {
      case 'thinking':
        return { bg: 'bg-emerald-500', text: 'text-emerald-500', pulse: 'bg-emerald-500' };
      case 'speaking':
        return { bg: 'bg-blue-500', text: 'text-blue-500', pulse: 'bg-blue-500' };
      case 'executed':
        return { bg: 'bg-green-500', text: 'text-green-500', pulse: 'bg-green-500' };
      case 'offline':
        return { bg: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-400', pulse: 'bg-slate-300' };
      default: // idle
        return { bg: 'bg-emerald-200 dark:bg-emerald-900', text: 'text-emerald-400', pulse: 'bg-emerald-200' };
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
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transition: { duration: 0.2 }
      }}
      onClick={handleClick}
      onMouseEnter={handleHover}
      className={`
        relative overflow-hidden
        ${isLarge ? 'w-64 p-6' : 'w-48 p-4'} 
        bg-white dark:bg-[#1a1d20]
        border border-slate-200 dark:border-slate-700 rounded-2xl 
        shadow-sm dark:shadow-none
        flex flex-col items-center gap-3
        transition-all duration-300
        ${clickable ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500' : 'cursor-default'}
        ${className}
      `}
    >
      {/* 状态指示器和标签 */}
      {showStatusLabel && (
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
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
        rounded-full bg-slate-100 dark:bg-[#242830] border border-slate-200 dark:border-slate-600
        flex items-center justify-center text-slate-400 dark:text-slate-500 relative
        shadow-inner
      `}>
        {/* 自定义图标或默认User图标 */}
        {icon || (
          <User 
            size={isLarge ? 48 : 32} 
            strokeWidth={1.2} 
            className={isActive ? 'text-emerald-500 dark:text-emerald-400' : ''}
          />
        )}
        
        {/* 活动状态的装饰环 */}
        <div className={`
          absolute inset-0 rounded-full border border-slate-100 dark:border-slate-700 scale-110 
          ${isActive ? 'animate-pulse border-emerald-200 dark:border-emerald-800' : ''}
        `} />
        
        {/* 特定状态的额外指示器 */}
        {isThinking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </motion.div>
        )}
        
        {isSpeaking && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </motion.div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="text-center z-10 w-full">
        <h3 className={`
          ${isLarge ? 'text-xl' : 'text-sm'} 
          font-medium text-slate-700 dark:text-slate-200 truncate tracking-tight
        `}>
          {agentName}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="h-[1px] w-4 bg-slate-200 dark:bg-slate-700" />
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">
            {agentRole}
          </p>
          <div className="h-[1px] w-4 bg-slate-200 dark:bg-slate-700" />
        </div>
        
        {/* 状态描述（可选） */}
        {isLarge && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {isOnline ? '在线' : '离线'} • {getStatusDescription(agentStatus)}
          </p>
        )}
      </div>

      {/* 活动状态的高光条 */}
      {isActive && (
        <motion.div 
          layoutId="activeGlow"
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500" 
        />
      )}

      {/* Agent ID标签（小尺寸显示） */}
      {!isLarge && agentId && (
        <div className="absolute bottom-2 left-3">
          <span className="text-[8px] text-slate-400 font-mono opacity-60">
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
