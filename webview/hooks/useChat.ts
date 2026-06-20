import { useCallback, useEffect, useState } from 'react';
import type { FileRef, ModelInfo } from '../../src/types';
import { vscodeApi } from '../lib/vscode';

export type { FileRef, ModelInfo };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming: boolean;
  error?: string;
  attachments?: FileRef[];
}

export function useChat() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileRef[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<FileRef[]>([]);

  // --- Stable callbacks (defined before effects that reference them) ---

  const addAttachments = useCallback((files: FileRef[]) => {
    setPendingAttachments((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path));
      const deduped = files.filter((f) => !existingPaths.has(f.path));
      return [...prev, ...deduped];
    });
  }, []);

  const removeAttachment = useCallback((filePath: string) => {
    setPendingAttachments((prev) => prev.filter((f) => f.path !== filePath));
  }, []);

  // --- Effects ---

  // Fetch models and workspace file list on mount
  useEffect(() => {
    vscodeApi.postMessage({ type: 'getModels' });
    vscodeApi.postMessage({ type: 'listFiles' });
  }, []);

  // Listen for messages from the extension host
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === 'models') {
        setModels([
          { key: 'auto', provider: 'router', name: 'Auto (router decides)' },
          ...msg.models,
        ]);
      }

      if (msg.type === 'fileList') {
        setAvailableFiles(msg.files as FileRef[]);
      }

      if (msg.type === 'filesPicked') {
        addAttachments(msg.files as FileRef[]);
      }

      if (msg.type === 'token') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, text: m.text + msg.token, streaming: true } : m
          )
        );
      }

      if (msg.type === 'done') {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, streaming: false } : m))
        );
        setIsStreaming(false);
      }

      if (msg.type === 'error') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, streaming: false, error: msg.message }
              : m
          )
        );
        setIsStreaming(false);
      }

      if (msg.type === 'refresh') {
        vscodeApi.postMessage({ type: 'getModels' });
      }

      if (msg.type === 'cleared') {
        setMessages([]);
        setPendingAttachments([]);
        setIsStreaming(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addAttachments]);

  // --- Action callbacks ---

  const send = useCallback(
    (text: string, attachments: FileRef[]) => {
      if (isStreaming || !text.trim()) return;

      const userId = crypto.randomUUID();
      const asstId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: 'user',
          text: text.trim(),
          streaming: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
        { id: asstId, role: 'assistant', text: '', streaming: true },
      ]);
      setIsStreaming(true);
      setPendingAttachments([]);

      vscodeApi.postMessage({
        type: 'chat',
        id: asstId,
        message: text.trim(),
        model: selectedModel,
        attachments: attachments.map((f) => f.path),
      });
    },
    [isStreaming, selectedModel]
  );

  const clearChat = useCallback(() => {
    vscodeApi.postMessage({ type: 'clearChat' });
  }, []);

  return {
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
  };
}
