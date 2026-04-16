import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

export default function ChatPanel({
  chatMessages,
  isStreaming,
  streamingContent,
  onSendMessage,
  error,
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamingContent]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="panel" id="chat-panel">
      <div className="panel__header">
        <span className="panel__title">3. Chat (Detailed Answers)</span>
        <span className="panel__badge">Session-Only</span>
      </div>

      <div className="chat-area" ref={scrollRef}>
        {chatMessages.length === 0 && !isStreaming ? (
          <div className="chat-empty">
            <div className="chat-empty__hint">
              Clicking a suggestion adds it to this chat and streams a detailed answer (separate
              prompt, more context). User can also type questions directly. One continuous chat per
              session — no login, no persistence.
            </div>
            <span>Click a suggestion or type a question below.</span>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {isStreaming && streamingContent && (
              <div className="chat-message chat-message--assistant">
                <span className="chat-message__label">AI Assistant</span>
                <div
                  className="chat-message__bubble markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownBasic(streamingContent),
                  }}
                />
              </div>
            )}

            {isStreaming && !streamingContent && (
              <div className="chat-message chat-message--assistant">
                <span className="chat-message__label">AI Assistant</span>
                <div className="typing-indicator">
                  <div className="typing-indicator__dot" />
                  <div className="typing-indicator__dot" />
                  <div className="typing-indicator__dot" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="error-banner" style={{ margin: '0 16px' }}>
          ⚠ {error}
        </div>
      )}

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isStreaming}
          id="chat-input"
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          id="chat-send-btn"
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function renderMarkdownBasic(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
