import { SUGGESTION_TYPES } from '../utils/constants';

export default function SuggestionCard({ suggestion, onClick }) {
  const typeInfo = SUGGESTION_TYPES[suggestion.type] || SUGGESTION_TYPES.KEY_INSIGHT;

  return (
    <div
      className="suggestion-card"
      data-type={suggestion.type}
      onClick={() => onClick(suggestion)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(suggestion)}
      id={`suggestion-${suggestion.title?.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="suggestion-card__header">
        <span className="suggestion-card__icon">{typeInfo.icon}</span>
        <span className="suggestion-card__type">{typeInfo.label}</span>
      </div>
      <div className="suggestion-card__title">{suggestion.title}</div>
      <div className="suggestion-card__preview">{suggestion.preview}</div>
      <div className="suggestion-card__click-hint">
        <span>→</span> Click for detailed answer
      </div>
    </div>
  );
}
