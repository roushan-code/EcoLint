import { window } from 'vscode';
import { Logger } from './logger.js';

export class ErrorHandler {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public handleError(error: unknown, context: string): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`${context}: ${message}`, error);
    void window.showErrorMessage(`EcoLint Error: ${message}`);
  }
}