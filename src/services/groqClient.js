import { GROQ_API_URL, WHISPER_MODEL, LLM_MODEL } from '../utils/constants';

/**
 * Transcribe an audio blob using Groq's Whisper API.
 * @param {Blob} audioBlob - The audio data to transcribe
 * @param {string} apiKey - Groq API key
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBlob, apiKey) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', WHISPER_MODEL);
  formData.append('response_format', 'json');
  formData.append('language', 'en');

  const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Transcription failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

/**
 * Generate suggestions using Groq's LLM API.
 * @param {string} systemPrompt - The system prompt
 * @param {string} userContent - The transcript context
 * @param {string} apiKey - Groq API key
 * @param {object} options - Temperature, max tokens, etc.
 * @returns {Promise<Array>} Parsed suggestions array
 */
export async function generateSuggestions(systemPrompt, userContent, apiKey, options = {}) {
  const { temperature = 0.7, maxTokens = 1024 } = options;

  const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature,
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Suggestion generation failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '[]';

  try {
    const parsed = JSON.parse(content);
    // Handle both { suggestions: [...] } and direct array formats
    const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
    return suggestions.slice(0, 3);
  } catch {
    console.error('Failed to parse suggestions JSON:', content);
    return [];
  }
}

/**
 * Stream a chat response using Groq's LLM API.
 * @param {Array} messages - Chat message history
 * @param {string} apiKey - Groq API key
 * @param {object} options - Temperature, max tokens, etc.
 * @returns {AsyncGenerator<string>} Yields text chunks
 */
export async function* streamChat(messages, apiKey, options = {}) {
  const { temperature = 0.7, maxTokens = 4096 } = options;

  const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature,
      max_completion_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Chat failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Skip malformed SSE lines
      }
    }
  }
}
