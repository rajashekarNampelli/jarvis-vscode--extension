import { useCallback, useEffect, useRef, useState } from 'react';
import { vscodeApi } from '../lib/vscode';

export interface ModelInfo {
  key: string;
  provider: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming: boolean;
  error?: string;
}

export function useChat() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Fetch models on mount
  useEffect(() => {
    vscodeApi.postMessage({ type: 'getModels' });
  }, []);

  // Listen for messages from the extension host
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === 'models') {
        const withAuto: ModelInfo[] = [
          { key: 'auto', provider: 'router', name: 'Auto (router decides)' },
          ...msg.models,
        ];
        setModels(withAuto);
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
        setIsStreaming(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const send = useCallback(
    (text: string) => {
      if (isStreaming || !text.trim()) return;

      const userId = crypto.randomUUID();
      const asstId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: text.trim(), streaming: false },
        { id: asstId, role: 'assistant', text: '', streaming: true },
      ]);
      setIsStreaming(true);

      vscodeApi.postMessage({
        type: 'chat',
        id: asstId,
        message: text.trim(),
        model: selectedModel,
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
  };
}
