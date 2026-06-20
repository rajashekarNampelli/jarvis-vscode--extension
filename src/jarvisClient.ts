import type { ModelInfo } from './types';

function hasStringToken(v: unknown): v is { token: string } {
  return typeof v === 'object' && v !== null && 'token' in v && typeof (v as Record<string, unknown>).token === 'string';
}

/** Accept JSON-wrapped SSE (`{"token":"Hi"}`) or legacy raw tokens (`Hi`). */
function parseSseToken(payload: string): string | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (hasStringToken(parsed)) {
      return parsed.token.length > 0 ? parsed.token : null;
    }
  } catch {
    // Fall through to raw token handling.
  }

  const token = payload.trim();
  return token.length > 0 ? token : null;
}

export async function listModels(baseUrl: string): Promise<ModelInfo[]> {
  const response = await fetch(`${baseUrl}/v1/models`);
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }
  const json = await response.json() as { models: ModelInfo[] };
  return json.models;
}

export async function* streamChat(
  baseUrl: string,
  message: string,
  model: string,
  context?: string
): AsyncGenerator<string> {
  const response = await fetch(`${baseUrl}/v1/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, model, context }),
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
      const payload = match[1];
      if (payload.trim() === '[DONE]') {
        return;
      }
      if (!payload) {
        continue;
      }
      const token = parseSseToken(payload);
      if (token) {
        yield token;
      }
    }
  }
}
