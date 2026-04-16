# TwinMind — Live Suggestions Web App

[![Deploy with Vercel](https://vercel.com/button)](https://twin-mind-ai-copilot.vercel.app/)
**Live Demo:** [https://twin-mind-ai-copilot.vercel.app/](https://twin-mind-ai-copilot.vercel.app/)

A real-time AI meeting copilot that listens to live audio, transcribes it, surfaces contextual suggestions, and provides detailed chat answers. Built for the TwinMind assignment.

## Tech Stack
- **Frontend:** React (Vite)
- **Styling:** Pure Vanilla CSS (Editorial Minimalist Dark Theme, Custom CSS Ripple Background)
- **Audio Capture:** MediaRecorder API
- **Transcription Context:** Groq API (`whisper-large-v3`)
- **LLM/Suggestions:** Groq API (`openai/gpt-oss-120b`)

## Setup Instructions

1. Clone or download the repository.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open the local URL (usually `http://localhost:5173`) in your browser.
5. You will be prompted to enter your Groq API Key. Get one at [console.groq.com](https://console.groq.com).

## Core Architecture and Decisions

- **Client-Side Only:** Since the prompt asked for the user to provide their own Groq API key (and no persistence/login), this is built as a pure client-side SPA. The API key is held in `sessionStorage`/React State.
- **Audio Chunking Strategy:** Instead of using the `timeSlice` parameter of `MediaRecorder` (which can create chunks missing headers), the app uses a stop-start cycle every 30 seconds. This guarantees each blob is a valid standalone audio file for Whisper.
- **Prompt Engineering Strategy:** The core to this app is generating useful suggestions. The system prompt identifies the context from the transcript and categorizes the suggestions into 5 distinct types (Question, Answer, Fact Check, Talking Point, Key Insight). The prompt explicitly asks to vary the suggestion types so you don't get 3 of the same kind.
- **Context Management:** Suggestions have a rolling context window (configurable, defaults to recent 10 segments). Clicking on a suggestion opens a chat with the *full* transcript context to give a comprehensive answer.

## UI / UX
Designed to match the dark, glassmorphic layout of modern AI tools with a responsive 3-column grid, animated cards, and smooth state transitions.
