import { window, WebviewPanel } from 'vscode';
import { ApiService } from '../services/apiService.js';
import { Logger } from '../infrastructure/logger.js';
import { registerWebviewPanel, showWebviewPanel } from '../views/webviewPanel.js';
import type { DiffResult } from '../types/diff.js';

let currentDiffData: DiffResult | null = null;
let currentOriginalCode: string = '';
let currentOptimizedCode: string = '';

const apiService = new ApiService(new Logger());

export async function showDiffCommand(
  originalCode: string,
  optimizedCode: string,
  fileName: string
): Promise<void> {
  try {
    currentOriginalCode = originalCode;
    currentOptimizedCode = optimizedCode;

    // Call backend to generate diff
    const response = await apiService.generateDiff(originalCode, optimizedCode);

    if (!response.success || !response.data) {
      window.showErrorMessage(`Failed to generate diff: ${response.error}`);
      return;
    }

    currentDiffData = response.data as DiffResult;

    // Register and show webview with diff data
    const panel = registerWebviewPanel();
    panel.webview.html = getDiffWebviewContent(currentDiffData, fileName);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'acceptAll':
          await handleAcceptAll(panel);
          break;
        case 'rejectAll':
          await handleRejectAll(panel);
          break;
        case 'acceptDiff':
          await handleAcceptDiff(panel, message.index);
          break;
        case 'rejectDiff':
          await handleRejectDiff(panel, message.index);
          break;
      }
    });

    showWebviewPanel();
  } catch (error) {
    window.showErrorMessage(`Error showing diff: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleAcceptAll(panel: WebviewPanel): Promise<void> {
  try {
    const response = await apiService.acceptChanges(currentOriginalCode, currentOptimizedCode);

    if (response.success && response.data) {
      panel.webview.postMessage({ command: 'applyCode', code: (response.data as any).code });
      window.showInformationMessage('All changes accepted!');
    } else {
      window.showErrorMessage(`Failed to accept changes: ${response.error}`);
    }
  } catch (error) {
    window.showErrorMessage(`Error accepting changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleRejectAll(panel: WebviewPanel): Promise<void> {
  panel.webview.postMessage({ command: 'applyCode', code: currentOriginalCode });
  window.showInformationMessage('All changes rejected - using original code');
}

async function handleAcceptDiff(panel: WebviewPanel, index: number): Promise<void> {
  try {
    const response = await apiService.acceptChanges(currentOriginalCode, currentOptimizedCode, index);

    if (response.success && response.data) {
      panel.webview.postMessage({ command: 'applyCode', code: (response.data as any).code });
      window.showInformationMessage(`Change ${index + 1} accepted`);
    } else {
      window.showErrorMessage(`Failed to accept change: ${response.error}`);
    }
  } catch (error) {
    window.showErrorMessage(`Error accepting change: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleRejectDiff(_panel: WebviewPanel, index: number): Promise<void> {
  window.showInformationMessage(`Change ${index + 1} rejected`);
}

function getDiffWebviewContent(diffData: DiffResult, fileName: string): string {
  const diffsHtml = diffData.diffs.map((diff, index) => {
    const lineNum = diff.lineNumber;
    let lineClass = '';
    let lineContent = '';
    let actionButtons = '';

    if (diff.type === 'add') {
      lineClass = 'diff-add';
      lineContent = `<span class="line-new">+ ${escapeHtml(diff.newLine ?? '')}</span>`;
    } else if (diff.type === 'remove') {
      lineClass = 'diff-remove';
      lineContent = `<span class="line-old">- ${escapeHtml(diff.originalLine ?? '')}</span>`;
    } else if (diff.type === 'modify') {
      lineClass = 'diff-modify';
      lineContent = `
        <div class="line-old">- ${escapeHtml(diff.originalLine ?? '')}</div>
        <div class="line-new">+ ${escapeHtml(diff.newLine ?? '')}</div>
      `;
    }

    actionButtons = `
      <div class="diff-actions">
        <button onclick="acceptDiff(${index})">Accept</button>
        <button onclick="rejectDiff(${index})">Reject</button>
      </div>
    `;

    return `
      <div class="diff-item ${lineClass}">
        <div class="diff-line-num">${lineNum}</div>
        <div class="diff-content">${lineContent}</div>
        ${actionButtons}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EcoLint Diff - ${escapeHtml(fileName)}</title>
  <style>
    body { 
      font-family: var(--vscode-font-family); 
      padding: 20px; 
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    h1 { color: var(--vscode-editor-foreground); margin-bottom: 10px; }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      padding: 10px;
      background: var(--vscode-editor-widget-background);
      border-radius: 4px;
    }
    .summary-item { font-weight: bold; }
    .summary-item.additions { color: #4ec9b0; }
    .summary-item.deletions { color: #f14c4c; }
    .summary-item.modifications { color: #dcdcaa; }
    .actions {
      margin-bottom: 20px;
    }
    .actions button {
      padding: 8px 16px;
      margin-right: 10px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      font-size: 14px;
    }
    .accept-all { background: #4ec9b0; color: #000; }
    .reject-all { background: #f14c4c; color: #fff; }
    .diff-container {
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .diff-item {
      display: flex;
      padding: 8px;
      border-bottom: 1px solid var(--vscode-widget-border);
    }
    .diff-item:last-child { border-bottom: none; }
    .diff-add { background: rgba(78, 201, 176, 0.1); }
    .diff-remove { background: rgba(241, 76, 76, 0.1); }
    .diff-modify { background: rgba(220, 220, 170, 0.1); }
    .diff-line-num {
      width: 50px;
      color: var(--vscode-editorLineNumber-foreground);
      text-align: right;
      padding-right: 10px;
      user-select: none;
    }
    .diff-content {
      flex: 1;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      white-space: pre-wrap;
    }
    .line-old { color: #f14c4c; }
    .line-new { color: #4ec9b0; }
    .diff-actions {
      margin-left: 10px;
    }
    .diff-actions button {
      padding: 4px 8px;
      margin-left: 5px;
      font-size: 12px;
      cursor: pointer;
      border: none;
      border-radius: 3px;
    }
    .diff-actions button:first-child { background: #4ec9b0; color: #000; }
    .diff-actions button:last-child { background: #f14c4c; color: #fff; }
  </style>
</head>
<body>
  <h1>Code Diff - ${escapeHtml(fileName)}</h1>
  
  <div class="summary">
    <span class="summary-item additions">+ ${diffData.summary.additions} additions</span>
    <span class="summary-item deletions">- ${diffData.summary.deletions} deletions</span>
    <span class="summary-item modifications">~ ${diffData.summary.modifications} modifications</span>
  </div>
  
  <div class="actions">
    <button class="accept-all" onclick="acceptAll()">Accept All</button>
    <button class="reject-all" onclick="rejectAll()">Reject All</button>
  </div>
  
  <div class="diff-container">
    ${diffsHtml || '<p>No differences found</p>'}
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function acceptAll() {
      vscode.postMessage({ command: 'acceptAll' });
    }

    function rejectAll() {
      vscode.postMessage({ command: 'rejectAll' });
    }

    function acceptDiff(index) {
      vscode.postMessage({ command: 'acceptDiff', index });
    }

    function rejectDiff(index) {
      vscode.postMessage({ command: 'rejectDiff', index });
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'applyCode') {
        vscode.postMessage({ command: 'codeApplied', code: message.code });
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}
