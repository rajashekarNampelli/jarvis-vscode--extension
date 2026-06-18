import * as vscode from 'vscode';
import { listModels, streamChat } from './jarvisClient';
import type { WebviewMessageIn, WebviewMessageOut } from './types';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'jarvis.chatView';

  private view?: vscode.WebviewView;

  constructor(private readonly ctx: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.ctx.extensionUri],
    };

    webviewView.webview.html = this.buildHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      (msg: WebviewMessageIn) => this.handleMessage(msg, webviewView.webview),
      undefined,
      this.ctx.subscriptions
    );
  }

  refreshModels(): void {
    this.post({ type: 'refresh' });
  }

  clearChat(): void {
    this.post({ type: 'cleared' });
  }

  private get baseUrl(): string {
    return vscode.workspace
      .getConfiguration('jarvis')
      .get<string>('baseUrl', 'http://localhost:8001');
  }

  private post(msg: WebviewMessageOut): void {
    this.view?.webview.postMessage(msg);
  }

  private async handleMessage(
    msg: WebviewMessageIn,
    webview: vscode.Webview
  ): Promise<void> {
    if (msg.type === 'getModels') {
      try {
        const models = await listModels(this.baseUrl);
        webview.postMessage({ type: 'models', models } satisfies WebviewMessageOut);
      } catch (err) {
        vscode.window.showErrorMessage(`Jarvis: Could not fetch models — ${String(err)}`);
      }
      return;
    }

    if (msg.type === 'chat') {
      const { id, message, model } = msg;
      try {
        for await (const token of streamChat(this.baseUrl, message, model)) {
          webview.postMessage({ type: 'token', id, token } satisfies WebviewMessageOut);
        }
        webview.postMessage({ type: 'done', id } satisfies WebviewMessageOut);
      } catch (err) {
        webview.postMessage({
          type: 'error',
          id,
          message: String(err),
        } satisfies WebviewMessageOut);
      }
      return;
    }

    if (msg.type === 'clearChat') {
      webview.postMessage({ type: 'cleared' } satisfies WebviewMessageOut);
    }
  }

  private buildHtml(webview: vscode.Webview): string {
    const distWebview = vscode.Uri.joinPath(this.ctx.extensionUri, 'dist', 'webview');
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distWebview, 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distWebview, 'assets', 'index.css')
    );
    const nonce = generateNonce();

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               style-src ${webview.cspSource} 'unsafe-inline';
               script-src 'nonce-${nonce}';
               connect-src ${this.baseUrl};" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>Jarvis</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
