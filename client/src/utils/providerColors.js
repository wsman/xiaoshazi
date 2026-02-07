export const getProviderColor = (provider) => {
  const colors = {
    'OpenAI': '#10a37f',      // Green
    'Anthropic': '#d97757',   // Terracotta/Orange
    'Google': '#4285F4',       // Blue
    'Meta': '#0668E1',        // Facebook Blue
    'DeepSeek': '#4ecca3',    // Neon Cyan
    'Mistral': '#fdb002',     // Yellow
    'Cohere': '#5B5B7B',      // Purple/Grey
    'Groq': '#9D5BFA',        // Purple
  };
  return colors[provider] || '#888888';
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
