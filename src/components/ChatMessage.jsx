/**
 * Renders a single chat message with basic markdown support.
 */
export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <span className="chat-message__label">{isUser ? 'You' : 'AI Assistant'}</span>

      {message.suggestionRef && (
        <span className="chat-message__suggestion-ref">
          ↳ Re: {message.suggestionRef}
        </span>
      )}

      <div
        className="chat-message__bubble markdown-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />

      {time && <span className="chat-message__time">{time}</span>}
    </div>
  );
}

/**
 * Minimal markdown renderer — handles headers, bold, italic, lists, code.
 * We avoid pulling in a full library to keep the bundle lean.
 */
function renderMarkdown(text) {
  if (!text) return '';

  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br\/>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br\/>/g, '') + '</ul>';
  });

  return `<p>${html}</p>`.replace(/<p><\/p>/g, '').replace(/<p>(<h[1-3]>)/g, '$1').replace(/(<\/h[1-3]>)<\/p>/g, '$1');
}
