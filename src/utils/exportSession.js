/**
 * Export the full session data as a readable text file download.
 * Includes transcript, suggestion batches, and chat history with timestamps.
 */
export async function exportSessionAsText(transcript, suggestionBatches, chatMessages) {
  let content = `TWINMIND SESSION EXPORT\n`;
  content += `Exported At: ${new Date().toLocaleString()}\n`;
  content += `Duration: ${calculateDuration(transcript)}\n`;
  content += `\n`;
  content += `====================================================\n`;
  content += `1. FULL TRANSCRIPT\n`;
  content += `====================================================\n\n`;

  if (transcript.length === 0) {
    content += `(No transcript recorded)\n`;
  } else {
    transcript.forEach(chunk => {
      content += `[${new Date(chunk.timestamp).toLocaleTimeString()}] ${chunk.text}\n`;
    });
  }

  content += `\n`;
  content += `====================================================\n`;
  content += `2. LIVE SUGGESTION BATCHES\n`;
  content += `====================================================\n\n`;

  if (suggestionBatches.length === 0) {
    content += `(No suggestions generated)\n`;
  } else {
    suggestionBatches.forEach((batch, i) => {
      content += `--- BATCH ${i + 1} @ ${new Date(batch.timestamp).toLocaleTimeString()} ---\n`;
      batch.suggestions.forEach(s => {
        content += `[${s.type}] ${s.title}\n`;
        content += `Preview: ${s.preview}\n`;
        content += `Query: ${s.detailedQuery}\n\n`;
      });
    });
  }

  content += `\n`;
  content += `====================================================\n`;
  content += `3. CHAT HISTORY\n`;
  content += `====================================================\n\n`;

  if (chatMessages.length === 0) {
    content += `(No chat messages)\n`;
  } else {
    chatMessages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      content += `[${time}] ${role}:\n`;
      if (msg.suggestionRef) {
        content += `(Triggered by suggestion: ${msg.suggestionRef})\n`;
      }
      content += `${msg.content}\n\n`;
    });
  }

  const fileName = `twinmind_session_${new Date().getTime()}.txt`;

  // Modern robust approach: File System Access API
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Text file',
          accept: {'text/plain': ['.txt']},
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (err) {
      // User cancelled save dialog or similar, gracefully fallback if not AbortError
      if (err.name === 'AbortError') return;
      console.error('File System Access API failed, using fallback:', err);
    }
  }

  // Fallback approach
  const blob = new Blob([content], {
    type: 'text/plain;charset=utf-8',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  
  document.body.appendChild(a);
  a.click();
  
  // Clean up with a long delay to ensure Windows/Chrome has fully registered the file stream
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 10000);
}

function calculateDuration(transcript) {
  if (transcript.length < 2) return '0s';
  const start = new Date(transcript[0].timestamp);
  const end = new Date(transcript[transcript.length - 1].timestamp);
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
