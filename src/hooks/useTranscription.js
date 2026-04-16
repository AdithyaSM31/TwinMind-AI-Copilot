import { useState, useCallback } from 'react';
import { transcribeAudio } from '../services/groqClient';

/**
 * Hook for transcribing audio blobs using Groq's Whisper API.
 *
 * @param {string} apiKey - Groq API key
 * @returns {{ transcribe, isTranscribing, error }}
 */
export function useTranscription(apiKey) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const transcribe = useCallback(
    async (audioBlob) => {
      if (!apiKey) {
        setError('Please set your Groq API key in Settings.');
        return null;
      }

      setIsTranscribing(true);
      setError(null);

      try {
        const text = await transcribeAudio(audioBlob, apiKey);

        // Filter out empty or very short transcriptions (noise)
        if (!text || text.trim().length < 3) {
          return null;
        }

        return {
          text: text.trim(),
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        console.error('Transcription error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    [apiKey]
  );

  return { transcribe, isTranscribing, error };
}
