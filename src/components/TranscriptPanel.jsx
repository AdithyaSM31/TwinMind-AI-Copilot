import { useRef, useEffect } from 'react';

export default function TranscriptPanel({
  transcript,
  isRecording,
  isTranscribing,
  onStartRecording,
  onStopRecording,
  error,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new chunks arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="panel" id="transcript-panel">
      <div className="panel__header">
        <span className="panel__title">1. Mic & Transcript</span>
        <span className="panel__badge">
          {isRecording ? (
            <span className="status-badge status-badge--recording">
              <span className="recording-indicator__dot" />
              REC
            </span>
          ) : (
            <span className="status-badge status-badge--idle">IDLE</span>
          )}
        </span>
      </div>

      <div className="transcript-controls">
        <button
          className={`mic-btn ${isRecording ? 'mic-btn--recording' : ''}`}
          onClick={isRecording ? onStopRecording : onStartRecording}
          id="mic-button"
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? '■' : '○'}
        </button>
        <div className="transcript-controls__info">
          <span className="transcript-controls__label">
            {isRecording ? 'Recording... Click to stop' : 'Click mic to start'}
          </span>
          <span className="transcript-controls__hint">
            Transcript appends every ~30s
          </span>
        </div>
      </div>

      {error && <div className="error-banner" style={{ margin: '12px 16px 0' }}>⚠ {error}</div>}

      {isTranscribing && (
        <div style={{ padding: '8px 16px' }}>
          <span className="status-badge status-badge--processing">
            <span className="spinner" /> Transcribing...
          </span>
        </div>
      )}

      <div className="transcript-area" ref={scrollRef}>
        {transcript.length === 0 ? (
          <div className="transcript-empty">
            <div className="transcript-empty__icon">○</div>
            <span>No transcript yet — start the mic.</span>
            <div className="info-box">
              The transcript scrolls and appends new chunks every ~30 seconds while recording.
              Use the mic button to start/stop.
            </div>
          </div>
        ) : (
          transcript.map((chunk, i) => (
            <div key={i} className="transcript-chunk">
              <span className="transcript-chunk__time">
                {new Date(chunk.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="transcript-chunk__text">{chunk.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
