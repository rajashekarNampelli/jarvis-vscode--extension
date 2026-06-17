import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new ChatViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),

    vscode.commands.registerCommand('jarvis.refreshModels', () => {
      provider.refreshModels();
    }),

    vscode.commands.registerCommand('jarvis.clearChat', () => {
      provider.clearChat();
    })
  );
}

export function deactivate(): void {
  // nothing to clean up — VS Code disposes subscriptions automatically
}
