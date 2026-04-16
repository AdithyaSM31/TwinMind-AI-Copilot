import { useState, useCallback, useRef, useEffect } from 'react';
import './index.css';

import TranscriptPanel from './components/TranscriptPanel';
import SuggestionsPanel from './components/SuggestionsPanel';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import ExportButton from './components/ExportButton';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useTranscription } from './hooks/useTranscription';
import { useSuggestions } from './hooks/useSuggestions';
import { useChat } from './hooks/useChat';
import Ripple from './components/Ripple';

import { DEFAULT_SETTINGS } from './utils/constants';
import {
  DEFAULT_SUGGESTION_PROMPT,
  DEFAULT_DETAIL_PROMPT,
  DEFAULT_CHAT_PROMPT,
} from './services/promptTemplates';

// Load settings from localStorage
function loadSettings() {
  try {
    const saved = localStorage.getItem('twinmind-settings');
    if (saved) {
      return { ...getDefaultFullSettings(), ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return getDefaultFullSettings();
}

function getDefaultFullSettings() {
  return {
    apiKey: '',
    suggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
    detailPrompt: DEFAULT_DETAIL_PROMPT,
    chatPrompt: DEFAULT_CHAT_PROMPT,
    ...DEFAULT_SETTINGS,
  };
}

export default function App() {
  // ─── State ───────────────────────────────────────────────
  const [settings, setSettings] = useState(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiPrompt, setShowApiPrompt] = useState(!loadSettings().apiKey);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const [transcript, setTranscript] = useState([]);
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');

  // Refs for latest state access in callbacks
  const transcriptRef = useRef(transcript);
  const batchesRef = useRef(suggestionBatches);
  const chatRef = useRef(chatMessages);
  transcriptRef.current = transcript;
  batchesRef.current = suggestionBatches;
  chatRef.current = chatMessages;

  // ─── Hooks ───────────────────────────────────────────────
  const { transcribe, isTranscribing, error: transcriptionError } = useTranscription(settings.apiKey);
  const {
    getSuggestions,
    isGenerating,
    error: suggestionError,
  } = useSuggestions(settings.apiKey, settings);
  const {
    sendMessage: sendChatMessage,
    sendSuggestion: sendChatSuggestion,
    isStreaming,
    error: chatError,
  } = useChat(settings.apiKey, settings);

  // ─── Audio chunk handler ────────────────────────────────
  const handleAudioChunk = useCallback(
    async (audioBlob) => {
      const chunk = await transcribe(audioBlob);
      if (chunk) {
        setTranscript((prev) => {
          const updated = [...prev, chunk];
          transcriptRef.current = updated;

          // After adding transcript, generate suggestions
          generateSuggestionsForTranscript(updated);

          return updated;
        });
      }
    },
    [transcribe]
  );

  const { isRecording, startRecording, stopRecording, error: micError } =
    useAudioRecorder(handleAudioChunk, settings.refreshInterval);

  // ─── Suggestion generation ──────────────────────────────
  const generateSuggestionsForTranscript = useCallback(
    async (currentTranscript) => {
      const batch = await getSuggestions(currentTranscript, batchesRef.current);
      if (batch) {
        setSuggestionBatches((prev) => {
          const updated = [...prev, batch];
          batchesRef.current = updated;
          return updated;
        });
      }
    },
    [getSuggestions]
  );

  // ─── Manual refresh ─────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (transcriptRef.current.length > 0) {
      generateSuggestionsForTranscript(transcriptRef.current);
    }
  }, [generateSuggestionsForTranscript]);

  // ─── Suggestion click → Chat ────────────────────────────
  const handleSuggestionClick = useCallback(
    async (suggestion) => {
      // Add user message (the suggestion)
      const userMsg = {
        role: 'user',
        content: `**${suggestion.title}**\n${suggestion.preview}`,
        timestamp: new Date().toISOString(),
        suggestionRef: suggestion.title,
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setStreamingContent('');

      const response = await sendChatSuggestion(
        suggestion,
        transcriptRef.current,
        chatRef.current,
        (partial) => setStreamingContent(partial)
      );

      if (response) {
        const assistantMsg = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
      setStreamingContent('');
    },
    [sendChatSuggestion]
  );

  // ─── Free-text chat ─────────────────────────────────────
  const handleSendMessage = useCallback(
    async (text) => {
      const userMsg = {
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setStreamingContent('');

      const response = await sendChatMessage(
        text,
        transcriptRef.current,
        chatRef.current,
        (partial) => setStreamingContent(partial)
      );

      if (response) {
        const assistantMsg = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
      setStreamingContent('');
    },
    [sendChatMessage]
  );

  // ─── Settings ───────────────────────────────────────────
  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('twinmind-settings', JSON.stringify(newSettings));
    if (newSettings.apiKey) {
      setShowApiPrompt(false);
    }
  }, []);

  // ─── API Key prompt ─────────────────────────────────────
  const handleApiKeySubmit = useCallback(() => {
    if (apiKeyInput.trim()) {
      const updated = { ...settings, apiKey: apiKeyInput.trim() };
      setSettings(updated);
      localStorage.setItem('twinmind-settings', JSON.stringify(updated));
      setShowApiPrompt(false);
    }
  }, [apiKeyInput, settings]);

  // ─── Render ──────────────────────────────────────────────

  // API key prompt overlay
  if (showApiPrompt) {
    return (
      <div className="api-key-prompt">
        <Ripple />
        <div className="api-key-prompt__card" style={{ zIndex: 1 }}>
          <div className="api-key-prompt__icon">✦</div>
          <h1 className="api-key-prompt__title">TwinMind</h1>
          <p className="api-key-prompt__desc">
            Live AI meeting suggestions powered by Groq. Paste your API key to get started.
          </p>
          <div className="api-key-prompt__input-group">
            <input
              className="api-key-prompt__input"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              placeholder="gsk_..."
              autoFocus
              id="initial-api-key-input"
            />
            <button
              className="btn btn--primary"
              onClick={handleApiKeySubmit}
              disabled={!apiKeyInput.trim()}
            >
              Go →
            </button>
          </div>
          <p className="api-key-prompt__desc" style={{ fontSize: '11px' }}>
            Your key stays in your browser only.{' '}
            <a
              href="https://console.groq.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-primary)' }}
            >
              Get a free key →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Ripple />
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo">✦</div>
          <span className="header__title">TwinMind</span>
          <span className="header__subtitle">Live Suggestions</span>
        </div>
        <div className="header__actions">
          <ExportButton
            transcript={transcript}
            suggestionBatches={suggestionBatches}
            chatMessages={chatMessages}
          />
          <button
            className="btn btn--sm"
            onClick={() => setShowSettings(true)}
            id="settings-btn"
          >
            ≡ Settings
          </button>
        </div>
      </header>

      {/* Three-column layout */}
      <main className="app-layout">
        <TranscriptPanel
          transcript={transcript}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          error={micError || transcriptionError}
        />

        <SuggestionsPanel
          suggestionBatches={suggestionBatches}
          isGenerating={isGenerating}
          onRefresh={handleRefresh}
          onSuggestionClick={handleSuggestionClick}
          isRecording={isRecording}
        />

        <ChatPanel
          chatMessages={chatMessages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onSendMessage={handleSendMessage}
          error={chatError || suggestionError}
        />
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
