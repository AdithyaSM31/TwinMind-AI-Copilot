export const GROQ_API_URL = 'https://api.groq.com/openai/v1';
export const WHISPER_MODEL = 'whisper-large-v3';
export const LLM_MODEL = 'openai/gpt-oss-120b';

export const DEFAULT_SETTINGS = {
  refreshInterval: 30,           // seconds between auto-refresh
  suggestionContextChunks: 10,   // number of recent transcript chunks for suggestions
  chatContextChunks: 50,         // number of transcript chunks for detailed answers
  temperature: 0.7,
  maxSuggestionTokens: 1024,
  maxChatTokens: 4096,
};

export const SUGGESTION_TYPES = {
  QUESTION: {
    label: 'Question to Ask',
    icon: '?',
    color: '#8b5cf6',
  },
  ANSWER: {
    label: 'Answer',
    icon: '↳',
    color: '#10b981',
  },
  FACT_CHECK: {
    label: 'Fact Check',
    icon: '✓',
    color: '#f59e0b',
  },
  TALKING_POINT: {
    label: 'Talking Point',
    icon: '▸',
    color: '#3b82f6',
  },
  KEY_INSIGHT: {
    label: 'Key Insight',
    icon: '✦',
    color: '#ec4899',
  },
};
