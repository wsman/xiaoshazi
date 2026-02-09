/**
 * Normalizes model names for display.
 * e.g., "meta-llama/Meta-Llama-3-70B-Instruct" -> "Llama 3 70B"
 *       "claude-4.6" -> "Claude 4.6"
 */
export const formatModelName = (name) => {
  if (!name) return 'Unknown Model';

  // If it's a full HF path, take the last part
  let cleanName = name.split('/').pop();

  // Normalize separators
  cleanName = cleanName.replace(/[_-]/g, ' ');

  // Remove common suffixes
  cleanName = cleanName
    .replace(/Instruct/gi, '')
    .replace(/Chat/gi, '')
    .replace(/hf/gi, '')
    .replace(/ v[0-9.]+/gi, '')
    .replace(/Base$/i, '')
    .trim();

  // Handle specific model families
  const lowercase = cleanName.toLowerCase();
  
  if (lowercase.includes('llama 3.1')) {
    cleanName = cleanName.replace(/.*llama 3.1/i, 'Llama 3.1');
  } else if (lowercase.includes('llama 3')) {
    cleanName = cleanName.replace(/.*llama 3/i, 'Llama 3');
  } else if (lowercase.includes('gpt 5.3')) {
    cleanName = 'GPT 5.3';
  } else if (lowercase.includes('gpt 4o')) {
    cleanName = 'GPT-4o';
  } else if (lowercase.includes('claude 4.6')) {
    cleanName = 'Claude 4.6';
  } else if (lowercase.includes('claude 3.5 sonnet')) {
    cleanName = 'Claude 3.5 Sonnet';
  } else if (lowercase.includes('gemini 2.0 ultra')) {
    cleanName = 'Gemini 2.0 Ultra';
  }

  // Capitalize first letters if not already handled
  cleanName = cleanName.split(' ')
    .map(word => {
      if (/^[0-9]+[Bb]$/.test(word)) return word.toUpperCase(); // 7B, 70B
      if (word.length <= 3) return word.toUpperCase(); // GPT, GLM
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  return cleanName.trim();
};
