import React from 'react';
import { useChat } from './hooks/useChat';
import { ModelSelector } from './components/ModelSelector';
import { MessageList } from './components/MessageList';
import { PromptInput } from './components/PromptInput';

export default function App() {
  const {
    models,
    selectedModel,
    setSelectedModel,
    messages,
    isStreaming,
    send,
    clearChat,
    availableFiles,
    pendingAttachments,
    addAttachments,
    removeAttachment,
  } = useChat();

  return (
    <div
      className="flex flex-col"
      style={{ height: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--separator)' }}
      >
        <span className="text-xs font-semibold tracking-wide opacity-70">JARVIS</span>
        <button
          onClick={clearChat}
          disabled={messages.length === 0 || isStreaming}
          className="text-xs opacity-50 hover:opacity-100 transition-opacity disabled:opacity-20"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Model selector */}
      <ModelSelector
        models={models}
        value={selectedModel}
        onChange={setSelectedModel}
        disabled={isStreaming}
      />

      {/* Message area */}
      <MessageList messages={messages} />

      {/* Input */}
      <PromptInput
        onSend={send}
        disabled={isStreaming}
        availableFiles={availableFiles}
        pendingAttachments={pendingAttachments}
        onAddAttachments={addAttachments}
        onRemoveAttachment={removeAttachment}
      />
    </div>
  );
}
