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

export const getTierColor = (tier) => {
  const colors = {
    'S': 'text-green-400 border-green-400/30 bg-green-400/10',
    'A': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    'B': 'text-gray-300 border-gray-300/30 bg-gray-300/10',
    'C': 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    'D': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    'F': 'text-red-400 border-red-400/30 bg-red-400/10',
  };
  return colors[tier] || 'text-gray-500 border-gray-500/30 bg-gray-500/10';
};
