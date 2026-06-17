import React, { useRef, useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function PromptInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow up to ~6 lines
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  return (
    <div
      className="flex items-end gap-2 px-3 py-2 border-t"
      style={{ borderColor: 'var(--separator)' }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Waiting for response…' : 'Message Jarvis  (Enter to send, Shift+Enter for newline)'}
        rows={1}
        className="flex-1 resize-none rounded-md px-3 py-2 text-sm outline-none leading-relaxed"
        style={{
          background: 'var(--input-bg)',
          color: 'var(--input-fg)',
          border: '1px solid var(--input-border)',
          minHeight: '36px',
          maxHeight: '140px',
          overflowY: 'auto',
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
        style={{
          background: 'var(--btn-bg)',
          color: 'var(--btn-fg)',
          height: '36px',
        }}
        title="Send (Enter)"
      >
        Send
      </button>
    </div>
  );
}
