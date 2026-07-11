import { window, StatusBarAlignment } from 'vscode';
import { Logger } from '../infrastructure/logger.js';

let statusBarItem: ReturnType<typeof window.createStatusBarItem> | undefined;

export function registerStatusBar(logger: Logger): void {
  if (!statusBarItem) {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(pulse) EcoLint';
    statusBarItem.tooltip = 'EcoLint - AI-powered code analysis';
    statusBarItem.command = 'ecolint.analyze';
    statusBarItem.show();
    logger.info('Status bar registered');
  }
}

export function updateStatusBar(text: string, tooltip?: string): void {
  if (statusBarItem) {
    statusBarItem.text = text;
    if (tooltip) {
      statusBarItem.tooltip = tooltip;
    }
  }
}

export function disposeStatusBar(): void {
  if (statusBarItem) {
    statusBarItem.dispose();
    statusBarItem = undefined;
  }
}