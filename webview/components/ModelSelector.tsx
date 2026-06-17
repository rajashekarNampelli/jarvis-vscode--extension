import React from 'react';
import type { ModelInfo } from '../hooks/useChat';

interface Props {
  models: ModelInfo[];
  value: string;
  onChange: (key: string) => void;
  disabled: boolean;
}

export function ModelSelector({ models, value, onChange, disabled }: Props) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b"
      style={{ borderColor: 'var(--separator)' }}
    >
      <span className="text-xs opacity-60 shrink-0">Model</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || models.length === 0}
        className="flex-1 text-xs rounded px-2 py-1 outline-none cursor-pointer"
        style={{
          background: 'var(--input-bg)',
          color: 'var(--input-fg)',
          border: '1px solid var(--input-border)',
        }}
      >
        {models.length === 0 ? (
          <option value="auto">Loading models…</option>
        ) : (
          models.map((m) => (
            <option key={m.key} value={m.key}>
              {m.name}
              {m.provider && m.provider !== 'router' ? ` · ${m.provider}` : ''}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
