export interface ModelInfo {
  key: string;
  provider: string;
  name: string;
}

export interface FileRef {
  path: string; // workspace-relative path
  name: string; // basename
}

export type WebviewMessageIn =
  | { type: 'getModels' }
  | { type: 'chat'; id: string; message: string; model: string; attachments: string[] }
  | { type: 'clearChat' }
  | { type: 'listFiles' }
  | { type: 'pickFiles' };

export type WebviewMessageOut =
  | { type: 'models'; models: ModelInfo[] }
  | { type: 'token'; id: string; token: string }
  | { type: 'done'; id: string }
  | { type: 'error'; id: string; message: string }
  | { type: 'refresh' }
  | { type: 'cleared' }
  | { type: 'fileList'; files: FileRef[] }
  | { type: 'filesPicked'; files: FileRef[] };
