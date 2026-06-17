import React from 'react';
import type { Message } from '../hooks/useChat';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col gap-1 px-3 py-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <span
        className="text-[10px] font-medium opacity-50 uppercase tracking-wider"
      >
        {isUser ? 'You' : 'Jarvis'}
      </span>
      <div
        className={`rounded-lg px-3 py-2 text-sm max-w-[90%] whitespace-pre-wrap break-words leading-relaxed ${
          message.streaming ? 'cursor-blink' : ''
        }`}
        style={{
          background: isUser ? 'var(--user-bubble)' : 'var(--assistant-bubble)',
          border: isUser ? '1px solid var(--separator)' : 'none',
          color: 'var(--fg)',
        }}
      >
        {message.error ? (
          <span className="text-red-400">Error: {message.error}</span>
        ) : message.text === '' && message.streaming ? (
          <span className="opacity-40 text-xs">Thinking…</span>
        ) : (
          message.text
        )}
      </div>
    </div>
  );
}
