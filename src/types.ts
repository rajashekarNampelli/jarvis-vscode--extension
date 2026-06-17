export interface ModelInfo {
  key: string;
  provider: string;
  name: string;
}

export type WebviewMessageIn =
  | { type: 'getModels' }
  | { type: 'chat'; id: string; message: string; model: string }
  | { type: 'clearChat' };

export type WebviewMessageOut =
  | { type: 'models'; models: ModelInfo[] }
  | { type: 'token'; id: string; token: string }
  | { type: 'done'; id: string }
  | { type: 'error'; id: string; message: string }
  | { type: 'refresh' }
  | { type: 'cleared' };
