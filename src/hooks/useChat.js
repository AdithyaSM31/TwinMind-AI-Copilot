import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/groqClient';
import { DEFAULT_DETAIL_PROMPT, DEFAULT_CHAT_PROMPT } from '../services/promptTemplates';

/**
 * Hook for managing chat interactions with streaming responses.
 *
 * @param {string} apiKey - Groq API key
 * @param {object} settings - User settings (prompts, context window, etc.)
 * @returns {{ sendMessage, sendSuggestion, isStreaming, error, abortStream }}
 */
export function useChat(apiKey, settings = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const abortStream = useCallback(() => {
    abortRef.current = true;
  }, []);

  /**
   * Send a suggestion click to chat — uses the detail prompt with full transcript context.
   */
  const sendSuggestion = useCallback(
    async (suggestion, transcript, chatMessages, onToken) => {
      if (!apiKey) {
        setError('Please set your Groq API key in Settings.');
        return null;
      }

      setIsStreaming(true);
      setError(null);
      abortRef.current = false;

      try {
        // Build full transcript context
        const contextChunks = settings.chatContextChunks || 50;
        const relevantTranscript = transcript.slice(-contextChunks);
        const transcriptText = relevantTranscript
          .map((c) => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.text}`)
          .join('\n');

        const systemPrompt = settings.detailPrompt || DEFAULT_DETAIL_PROMPT;

        const messages = [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `MEETING TRANSCRIPT:\n${transcriptText}\n\nSUGGESTION CONTEXT:\nType: ${suggestion.type}\nTitle: ${suggestion.title}\nPreview: ${suggestion.preview}\n\nQUESTION: ${suggestion.detailedQuery}`,
          },
        ];

        let fullResponse = '';
        for await (const token of streamChat(messages, apiKey, {
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxChatTokens || 4096,
        })) {
          if (abortRef.current) break;
          fullResponse += token;
          onToken(fullResponse);
        }

        return fullResponse;
      } catch (err) {
        console.error('Chat error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsStreaming(false);
      }
    },
    [apiKey, settings]
  );

  /**
   * Send a free-text user message — uses the chat prompt with transcript context.
   */
  const sendMessage = useCallback(
    async (userMessage, transcript, chatMessages, onToken) => {
      if (!apiKey) {
        setError('Please set your Groq API key in Settings.');
        return null;
      }

      setIsStreaming(true);
      setError(null);
      abortRef.current = false;

      try {
        const contextChunks = settings.chatContextChunks || 50;
        const relevantTranscript = transcript.slice(-contextChunks);
        const transcriptText = relevantTranscript
          .map((c) => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.text}`)
          .join('\n');

        const systemPrompt = settings.chatPrompt || DEFAULT_CHAT_PROMPT;

        // Build conversation history (last 10 messages for context)
        const recentChat = chatMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const messages = [
          {
            role: 'system',
            content: `${systemPrompt}\n\nMEETING TRANSCRIPT:\n${transcriptText}`,
          },
          ...recentChat,
          { role: 'user', content: userMessage },
        ];

        let fullResponse = '';
        for await (const token of streamChat(messages, apiKey, {
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxChatTokens || 4096,
        })) {
          if (abortRef.current) break;
          fullResponse += token;
          onToken(fullResponse);
        }

        return fullResponse;
      } catch (err) {
        console.error('Chat error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsStreaming(false);
      }
    },
    [apiKey, settings]
  );

  return { sendMessage, sendSuggestion, isStreaming, error, abortStream };
}
