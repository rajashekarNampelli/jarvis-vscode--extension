# Jarvis VS Code Extension

A VS Code sidebar chat panel powered by [jarvis-model-router](../jarvis-model-router). Select from all locally available models and get token-streamed responses — no API key required.

## Features

- Activity Bar icon opens a Cursor-like chat sidebar
- Model dropdown populated live from `GET /v1/models` on the router
- Streamed responses via SSE (`POST /v1/chat/stream`) — tokens appear as they arrive
- Follows VS Code's active color theme (light/dark/high-contrast)
- `Jarvis: Refresh Models` and `Jarvis: Clear Chat` commands available in the Command Palette
- Full Markdown rendering in assistant responses (headings, bold, code blocks, tables, lists) via `react-markdown` + `remark-gfm`

## Prerequisites

| Requirement | Version |
|---|---|
| VS Code | 1.90+ |
| Node.js | 18+ |
| [jarvis-model-router](../jarvis-model-router) | running on `http://localhost:8001` |

## Quick start (development)

```bash
# 1. Clone and install
git clone <this repo>
cd jarvis-vscode-extension
npm install

# 2. Build (extension host + webview)
npm run build

# 3. Open the folder in VS Code, then press F5
#    This launches the Extension Development Host with the extension loaded.
```

### Manual smoke test

1. Start `jarvis-model-router` on port 8001:
   ```bash
   cd ../jarvis-model-router
   uvicorn jarvis_model_router.main:app --port 8001 --host 0.0.0.0
   ```
2. Press **F5** in VS Code — a new _Extension Development Host_ window opens.
3. Click the **Jarvis** icon in the Activity Bar (left sidebar).
4. The model dropdown should populate with all models returned by the router (e.g. `llama3`, `qwen2.5:0.5b`). The first option is always **Auto (router decides)**.
5. Type a message and press **Enter** — tokens stream into the assistant bubble in real-time.
6. Use **Shift+Enter** to insert a newline without sending.
7. The **Clear** button in the panel header resets the conversation.

### Configuring the router URL

If your router runs on a different host or port, change it in VS Code settings:

```
Settings → Jarvis → Base Url
```

Or directly in `settings.json`:

```json
"jarvis.baseUrl": "http://localhost:8001"
```

## Project structure

```
jarvis-vscode-extension/
├── src/                    # Extension host (Node/TypeScript, bundled with esbuild)
│   ├── extension.ts        # activate() / deactivate()
│   ├── ChatViewProvider.ts # WebviewViewProvider: lifecycle + message bridge
│   ├── jarvisClient.ts     # listModels() + streamChat() SSE generator
│   └── types.ts            # Shared message types (host ↔ webview)
├── webview/                # React UI (bundled with Vite + Tailwind)
│   ├── App.tsx             # Root component
│   ├── hooks/useChat.ts    # All state: models, messages, streaming flag
│   ├── components/
│   │   ├── ModelSelector.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── PromptInput.tsx
│   ├── lib/vscode.ts       # acquireVsCodeApi() wrapper
│   └── styles.css          # Tailwind directives + VS Code CSS variable bridge
├── media/icon.svg          # Activity Bar icon
└── dist/                   # Build output (gitignored)
    ├── extension.js
    └── webview/
        └── assets/
```

## Architecture

```
React Webview  →(postMessage)→  Extension Host  →(fetch SSE)→  jarvis-model-router
               ←(postMessage)←                  ←(SSE chunks)←
```

The extension host proxies all network traffic so the webview never needs direct access to the router — this keeps the Content Security Policy tight and avoids CORS issues.

## Build scripts

| Script | Description |
|---|---|
| `npm run build` | Full build (webview + extension host) |
| `npm run build:webview` | Vite build only (`dist/webview/`) |
| `npm run build:ext` | esbuild only (`dist/extension.js`) |
| `npm run watch:ext` | esbuild in watch mode |
| `npm run watch:webview` | Vite in watch mode |
| `npm run package` | Produce `.vsix` for manual install |

## Packaging for manual install

```bash
npm run build
npm run package
# Produces jarvis-vscode-extension-0.0.1.vsix
# Install: code --install-extension jarvis-vscode-extension-0.0.1.vsix
```

## Roadmap (v2 ideas)

- Multi-turn conversation memory (client-side message concatenation)
- Auto-inject active editor selection as context
- Syntax-highlighted code blocks (Shiki)
- Conversation export
- Test suite (Vitest for webview, `@vscode/test-electron` for host)
