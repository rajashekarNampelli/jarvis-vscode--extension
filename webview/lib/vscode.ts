// acquireVsCodeApi is injected by VS Code into the webview context.
// We call it once and re-export so it can be imported anywhere.
declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

export const vscodeApi = acquireVsCodeApi();
