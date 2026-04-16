import { exportSessionAsText } from '../utils/exportSession';

export default function ExportButton({ transcript, suggestionBatches, chatMessages }) {
  const handleExport = async () => {
    await exportSessionAsText(transcript, suggestionBatches, chatMessages);
  };

  const isDisabled = transcript.length === 0 && chatMessages.length === 0;

  return (
    <button
      className="btn btn--sm"
      onClick={handleExport}
      disabled={isDisabled}
      title="Export full session: transcript + suggestions + chat"
      id="export-btn"
    >
      ↓ Export
    </button>
  );
}
