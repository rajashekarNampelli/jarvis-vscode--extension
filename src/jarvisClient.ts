import type { ModelInfo } from './types';

export async function listModels(baseUrl: string): Promise<ModelInfo[]> {
  const response = await fetch(`${baseUrl}/v1/models`);
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return json.models as ModelInfo[];
}

export async function* streamChat(
  baseUrl: string,
  message: string,
  model: string
): AsyncGenerator<string> {
  const response = await fetch(`${baseUrl}/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, model }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    // Keep the last potentially incomplete chunk in the buffer
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const match = chunk.match(/^data:\s?(.*)$/m);
      if (!match) {
        continue;
      }
      const payload = match[1].trim();
      if (payload === '[DONE]') {
        return;
      }
      if (payload) {
        yield payload;
      }
    }
  }
}
