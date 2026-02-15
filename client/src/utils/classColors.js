// 样式统一: 使用 nordic-minimal.css 主题变量

export const getClassColor = (className) => {
  const colors = {
    'Demon Hunter': '#A330C9',
    'Death Knight': '#C41E3A',
    'Hunter': '#AAD372',
    'Rogue': '#FFF468',
    'Mage': '#3FC7EB',
    'Priest': '#FFFFFF',
    'Shaman': '#0070DD',
    'Warlock': '#8788EE',
    'Paladin': '#F48CBA',
    'Druid': '#FF7C0A',
    'Monk': '#00EB98',
  };
  return colors[className] || '#888888';
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

// 使用 nordic-minimal.css 主题变量统一颜色
export const getTierColor = (tier) => {
  const colors = {
    'S': 'text-[var(--nordic-aurora-amber)] border-[var(--nordic-aurora-amber)]/30 bg-[var(--nordic-aurora-amber)]/10',
    'A': 'text-[var(--nordic-aurora-purple)] border-[var(--nordic-aurora-purple)]/30 bg-[var(--nordic-aurora-purple)]/10',
    'B': 'text-[var(--nordic-fjord)] border-[var(--nordic-fjord)]/30 bg-[var(--nordic-fjord)]/10',
    'C': 'text-[var(--nordic-pine)] border-[var(--nordic-pine)]/30 bg-[var(--nordic-pine)]/10',
    'D': 'text-[var(--nordic-stone)] border-[var(--nordic-stone)]/30 bg-[var(--nordic-stone)]/10',
    'F': 'text-[var(--status-error)] border-[var(--status-error)]/30 bg-[var(--status-error)]/10',
  };
  return colors[tier] || 'text-[var(--text-tertiary)] border-[var(--border-primary)] bg-[var(--bg-tertiary)]';
};
