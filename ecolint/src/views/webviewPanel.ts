import { window, WebviewPanel, ViewColumn } from 'vscode';

let currentPanel: WebviewPanel | undefined;

export function registerWebviewPanel(): WebviewPanel {
  if (currentPanel) {
    currentPanel.reveal(ViewColumn.One);
    return currentPanel;
  }

  currentPanel = window.createWebviewPanel(
    'ecolintWebview',
    'EcoLint Results',
    ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  currentPanel.webview.html = getWebviewContent();
  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });

  return currentPanel;
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EcoLint Results</title>
  <style>
    body { font-family: var(--vscode-font-family); padding: 20px; }
    h1 { color: var(--vscode-editor-foreground); }
    .result { margin: 10px 0; padding: 10px; background: var(--vscode-editor-background); }
  </style>
</head>
<body>
  <h1>EcoLint Analysis Results</h1>
  <div id="results">Loading...</div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', event => {
      document.getElementById('results').innerHTML = JSON.stringify(event.data, null, 2);
    });
  </script>
</body>
</html>`;
}

export function showWebviewPanel(): void {
  if (currentPanel) {
    currentPanel.reveal(ViewColumn.One);
  }
}