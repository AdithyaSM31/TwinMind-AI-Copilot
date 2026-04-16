import { useRef, useEffect } from 'react';
import SuggestionCard from './SuggestionCard';

export default function SuggestionsPanel({
  suggestionBatches,
  isGenerating,
  onRefresh,
  onSuggestionClick,
  isRecording,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to top when new batch arrives (newest first)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [suggestionBatches.length]);

  return (
    <div className="panel" id="suggestions-panel">
      <div className="panel__header">
        <span className="panel__title">2. Live Suggestions</span>
        <span className="panel__badge">{suggestionBatches.length} Batches</span>
      </div>

      <div className="suggestions-controls">
        <button
          className="btn btn--sm"
          onClick={onRefresh}
          disabled={isGenerating || !isRecording}
          id="refresh-suggestions-btn"
        >
          {isGenerating ? (
            <>
              <span className="spinner" /> Generating...
            </>
          ) : (
            <>↻ Reload suggestions</>
          )}
        </button>
        <span className="auto-refresh-label">auto-refresh in 30s</span>
      </div>

      <div className="suggestions-area" ref={scrollRef}>
        {suggestionBatches.length === 0 ? (
          <div className="suggestions-empty">
            <div className="suggestions-empty__hint">
              {isRecording ? (
                <>Generating first batch of suggestions... Waiting for transcript.</>
              ) : (
                <>
                  On reload (or auto every ~30s), generate <strong>3 fresh suggestions</strong> from
                  recent transcript context. New batch appears at the top; older batches push down.
                  Each is a tappable card: a{' '}
                  <span style={{ color: 'var(--color-question)' }}>question to ask</span>, a{' '}
                  <span style={{ color: 'var(--color-talkingpoint)' }}>talking point</span>, an{' '}
                  <span style={{ color: 'var(--color-answer)' }}>answer</span>, or a{' '}
                  <span style={{ color: 'var(--color-factcheck)' }}>fact-check</span>. The preview
                  alone should already be useful.
                </>
              )}
            </div>
            {!isRecording && <span>Suggestions appear here once recording starts.</span>}
          </div>
        ) : (
          <>
            {isGenerating && (
              <div>
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
              </div>
            )}

            {[...suggestionBatches].reverse().map((batch, batchIndex) => (
              <div key={batchIndex} className="suggestion-batch">
                <div className="suggestion-batch__time">
                  {new Date(batch.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {batchIndex === 0 && !isGenerating && ' — Latest'}
                </div>

                {batch.suggestions.map((suggestion, i) => (
                  <SuggestionCard
                    key={`${batchIndex}-${i}`}
                    suggestion={suggestion}
                    onClick={onSuggestionClick}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
