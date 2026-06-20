import React, { useEffect, useRef } from 'react';
import type { FileRef } from '../../src/types';

interface Props {
  files: FileRef[];
  query: string;
  onSelect: (file: FileRef) => void;
  onDismiss: () => void;
}

export function MentionDropdown({ files, query, onSelect, onDismiss }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const lq = query.toLowerCase();
  const matches = files.filter(
    (f) =>
      f.name.toLowerCase().includes(lq) ||
      f.path.toLowerCase().includes(lq)
  ).slice(0, 12);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Keyboard handler attached to the document so it works while the textarea has focus
  useEffect(() => {
    if (matches.length === 0) {
      onDismiss();
      return;
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (matches[activeIndex]) {
          onSelect(matches[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [matches, activeIndex, onSelect, onDismiss]);

  if (matches.length === 0) return null;

  return (
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        maxHeight: '180px',
        overflowY: 'auto',
        background: 'var(--input-bg)',
        border: '1px solid var(--separator)',
        borderRadius: '6px',
        marginBottom: '4px',
        padding: '2px 0',
        zIndex: 100,
        listStyle: 'none',
        margin: 0,
      }}
    >
      {matches.map((file, i) => (
        <li
          key={file.path}
          role="option"
          aria-selected={i === activeIndex}
          onMouseEnter={() => setActiveIndex(i)}
          onClick={() => onSelect(file)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '5px 10px',
            cursor: 'pointer',
            background: i === activeIndex ? 'var(--list-hover)' : 'transparent',
            color: 'var(--fg)',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{file.name}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.path}
          </span>
        </li>
      ))}
    </ul>
  );
}
