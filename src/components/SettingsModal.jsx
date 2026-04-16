import { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '../utils/constants';
import {
  DEFAULT_SUGGESTION_PROMPT,
  DEFAULT_DETAIL_PROMPT,
  DEFAULT_CHAT_PROMPT,
} from '../services/promptTemplates';

export default function SettingsModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings });

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const update = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  const handleResetDefaults = () => {
    setLocal({
      ...local,
      suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
      detailPrompt: DEFAULT_DETAIL_PROMPT,
      chatPrompt: DEFAULT_CHAT_PROMPT,
      refreshInterval: DEFAULT_SETTINGS.refreshInterval,
      suggestionContextChunks: DEFAULT_SETTINGS.suggestionContextChunks,
      chatContextChunks: DEFAULT_SETTINGS.chatContextChunks,
      temperature: DEFAULT_SETTINGS.temperature,
      maxSuggestionTokens: DEFAULT_SETTINGS.maxSuggestionTokens,
      maxChatTokens: DEFAULT_SETTINGS.maxChatTokens,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" id="settings-modal">
        <div className="modal__header">
          <h2 className="modal__title">≡ Settings</h2>
          <button className="btn btn--sm btn--icon" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="modal__body">
          {/* API Key */}
          <div className="form-group">
            <label className="form-group__label">Groq API Key</label>
            <input
              className="form-input"
              type="password"
              value={local.apiKey || ''}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="gsk_..."
              id="api-key-input"
            />
            <span className="form-group__hint">
              Your key is stored only in this browser session. Get one at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-accent)' }}>
                console.groq.com
              </a>
            </span>
          </div>

          <div className="divider" />

          {/* Parameters */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">Refresh Interval (sec)</label>
              <input
                className="form-input"
                type="number"
                min="10"
                max="120"
                value={local.refreshInterval || 30}
                onChange={(e) => update('refreshInterval', parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="form-group">
              <label className="form-group__label">Temperature</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={local.temperature || 0.7}
                onChange={(e) => update('temperature', parseFloat(e.target.value) || 0.7)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">Suggestion Context (chunks)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="50"
                value={local.suggestionContextChunks || 10}
                onChange={(e) => update('suggestionContextChunks', parseInt(e.target.value) || 10)}
              />
              <span className="form-group__hint">How many recent transcript chunks to include for suggestions</span>
            </div>
            <div className="form-group">
              <label className="form-group__label">Chat Context (chunks)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="100"
                value={local.chatContextChunks || 50}
                onChange={(e) => update('chatContextChunks', parseInt(e.target.value) || 50)}
              />
              <span className="form-group__hint">How many transcript chunks for detailed answers</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-group__label">Max Suggestion Tokens</label>
              <input
                className="form-input"
                type="number"
                min="256"
                max="4096"
                step="128"
                value={local.maxSuggestionTokens || 1024}
                onChange={(e) => update('maxSuggestionTokens', parseInt(e.target.value) || 1024)}
              />
            </div>
            <div className="form-group">
              <label className="form-group__label">Max Chat Tokens</label>
              <input
                className="form-input"
                type="number"
                min="256"
                max="8192"
                step="256"
                value={local.maxChatTokens || 4096}
                onChange={(e) => update('maxChatTokens', parseInt(e.target.value) || 4096)}
              />
            </div>
          </div>

          <div className="divider" />

          {/* Prompts */}
          <div className="form-group">
            <label className="form-group__label">Live Suggestion Prompt</label>
            <textarea
              className="form-input form-textarea"
              value={local.suggestionPrompt || DEFAULT_SUGGESTION_PROMPT}
              onChange={(e) => update('suggestionPrompt', e.target.value)}
              rows={6}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Detailed Answer on-Click Prompt</label>
            <textarea
              className="form-input form-textarea"
              value={local.detailPrompt || DEFAULT_DETAIL_PROMPT}
              onChange={(e) => update('detailPrompt', e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Chat Prompt</label>
            <textarea
              className="form-input form-textarea"
              value={local.chatPrompt || DEFAULT_CHAT_PROMPT}
              onChange={(e) => update('chatPrompt', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--sm" onClick={handleResetDefaults} id="reset-defaults-btn">
            Reset to Defaults
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn--sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--sm btn--primary" onClick={handleSave} id="save-settings-btn">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
