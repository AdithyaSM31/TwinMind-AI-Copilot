import { useState, useRef, useCallback } from 'react';

/**
 * Hook for recording audio from the user's microphone in 30-second chunks.
 * Uses a stop-start approach to ensure each blob is a valid standalone audio file.
 *
 * @param {function} onChunkReady - Callback when a 30s audio chunk is available
 * @param {number} intervalSeconds - Seconds between chunks (default 30)
 * @returns {{ isRecording, startRecording, stopRecording, error }}
 */
export function useAudioRecorder(onChunkReady, intervalSeconds = 30) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const isRecordingRef = useRef(false);

  const collectAndRestart = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    // Stop current recording to finalize the blob
    recorder.stop();
  }, []);

  const startNewRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];

    // Determine supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        onChunkReady(blob);
      }

      // Restart if still recording
      if (isRecordingRef.current) {
        startNewRecording();
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
  }, [onChunkReady]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);

      startNewRecording();

      // Set up interval to collect chunks every N seconds
      intervalRef.current = setInterval(collectAndRestart, intervalSeconds * 1000);
    } catch (err) {
      const message =
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : err.name === 'NotFoundError'
            ? 'No microphone found. Please connect a microphone and try again.'
            : `Microphone error: ${err.message}`;
      setError(message);
      console.error('Audio recording error:', err);
    }
  }, [startNewRecording, collectAndRestart, intervalSeconds]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop(); // This will trigger onstop → onChunkReady for remaining audio
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return { isRecording, startRecording, stopRecording, error };
}
