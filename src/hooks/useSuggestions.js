import { useState, useCallback } from 'react';
import { generateSuggestions } from '../services/groqClient';
import { DEFAULT_SUGGESTION_PROMPT } from '../services/promptTemplates';

/**
 * Hook for generating contextual suggestions from transcript data.
 *
 * @param {string} apiKey - Groq API key
 * @param {object} settings - User settings (prompts, context window, etc.)
 * @returns {{ getSuggestions, isGenerating, error }}
 */
export function useSuggestions(apiKey, settings = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const getSuggestions = useCallback(
    async (transcript, previousBatches = []) => {
      if (!apiKey) {
        setError('Please set your Groq API key in Settings.');
        return null;
      }

      if (!transcript || transcript.length === 0) {
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        // Build context window from recent transcript chunks
        const contextChunks = settings.suggestionContextChunks || 10;
        const recentTranscript = transcript.slice(-contextChunks);
        const fullTranscriptText = recentTranscript
          .map((chunk, i) => `[${new Date(chunk.timestamp).toLocaleTimeString()}] ${chunk.text}`)
          .join('\n');

        // Build previous suggestions summary to avoid repetition
        const recentBatches = previousBatches.slice(-3);
        const previousSuggestions = recentBatches
          .flatMap((b) => b.suggestions)
          .map((s) => `- [${s.type}] ${s.title}: ${s.preview}`)
          .join('\n');

        // Prepare the system prompt with previous suggestions injected
        const promptTemplate = settings.suggestionPrompt || DEFAULT_SUGGESTION_PROMPT;
        const systemPrompt = promptTemplate.replace(
          '{previousSuggestions}',
          previousSuggestions || 'None yet — this is the first batch.'
        );

        // user message: the transcript context
        const userContent = `CURRENT CONVERSATION TRANSCRIPT:\n\n${fullTranscriptText}\n\nGenerate exactly 3 suggestions based on the above transcript. Focus especially on the most recent segments. Respond with ONLY a valid JSON array.`;

        const suggestions = await generateSuggestions(systemPrompt, userContent, apiKey, {
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxSuggestionTokens || 1024,
        });

        if (!suggestions || suggestions.length === 0) {
          throw new Error('No suggestions generated');
        }

        return {
          suggestions,
          timestamp: new Date().toISOString(),
          transcriptContext: fullTranscriptText,
        };
      } catch (err) {
        console.error('Suggestion generation error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiKey, settings]
  );

  return { getSuggestions, isGenerating, error };
}
