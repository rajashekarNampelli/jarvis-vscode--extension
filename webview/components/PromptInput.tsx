import React, { useRef, useState } from 'react';
import type { FileRef } from '../../src/types';
import { MentionDropdown } from './MentionDropdown';
import { vscodeApi } from '../lib/vscode';

interface Props {
  onSend: (text: string, attachments: FileRef[]) => void;
  disabled: boolean;
  availableFiles: FileRef[];
  pendingAttachments: FileRef[];
  onAddAttachments: (files: FileRef[]) => void;
  onRemoveAttachment: (path: string) => void;
}

export function PromptInput({
  onSend,
  disabled,
  availableFiles,
  pendingAttachments,
  onAddAttachments,
  onRemoveAttachment,
}: Props) {
  const [value, setValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text, pendingAttachments);
    setValue('');
    setMentionQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Let MentionDropdown handle arrow/enter/esc when open
    if (mentionQuery !== null) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);

    // Auto-grow up to ~6 lines
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;

    // Detect "@" mention: find the last "@" token in the current word
    const cursor = el.selectionStart ?? newVal.length;
    const textBefore = newVal.slice(0, cursor);
    const atMatch = textBefore.match(/@([\w./\-]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (file: FileRef) => {
    // Replace the "@query" token with the selected file reference
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursor);
    const textAfter = value.slice(cursor);
    const replaced = textBefore.replace(/@([\w./\-]*)$/, '');
    setValue(replaced + textAfter);
    setMentionQuery(null);

    // Add to attachments if not already present
    if (!pendingAttachments.some((a) => a.path === file.path)) {
      onAddAttachments([file]);
    }

    // Restore focus
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handlePickFiles = () => {
    vscodeApi.postMessage({ type: 'pickFiles' });
  };

  return (
    <div
      className="flex flex-col border-t"
      style={{ borderColor: 'var(--separator)' }}
    >
      {/* Attachment chips */}
      {pendingAttachments.length > 0 && (
        <div
          className="flex flex-wrap gap-1 px-3 pt-2"
        >
          {pendingAttachments.map((f) => (
            <span
              key={f.path}
              className="flex items-center gap-1 rounded text-xs px-2 py-0.5"
              style={{
                background: 'var(--badge-bg)',
                color: 'var(--badge-fg)',
                maxWidth: '180px',
              }}
              title={f.path}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '140px',
                }}
              >
                {f.name}
              </span>
              <button
                onClick={() => onRemoveAttachment(f.path)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                style={{ lineHeight: 1, marginLeft: '2px' }}
                title={`Remove ${f.name}`}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Composer row */}
      <div
        className="flex items-end gap-2 px-3 py-2"
        style={{ position: 'relative' }}
      >
        {/* @ mention dropdown — positioned above composer */}
        {mentionQuery !== null && (
          <div style={{ position: 'absolute', left: '12px', right: '12px', bottom: '100%' }}>
            <MentionDropdown
              files={availableFiles}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onDismiss={() => setMentionQuery(null)}
            />
          </div>
        )}

        {/* Paperclip button */}
        <button
          type="button"
          onClick={handlePickFiles}
          disabled={disabled}
          className="shrink-0 rounded-md text-sm transition-opacity disabled:opacity-40 hover:opacity-80 flex items-center justify-center"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--fg)',
            border: '1px solid var(--input-border)',
            height: '36px',
            width: '36px',
          }}
          title="Add files (workspace)"
          aria-label="Attach files"
        >
          {/* Paperclip SVG */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? 'Waiting for response…'
              : 'Message Jarvis — type @ to mention a file (Enter to send, Shift+Enter for newline)'
          }
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

        {/* Send button */}
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
    </div>
  );
}
