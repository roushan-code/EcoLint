/**
 * Validate Command
 * 
 * Validates optimized code by running compilation, linting, and tests.
 */

import * as vscode from 'vscode';
import { ValidationAgent } from '../services/validationAgent.js';
import { Logger } from '../infrastructure/logger.js';
import type { ValidationRequest } from '../types/validation.js';
// import type { OutputChannel } from 'vscode';

export class ValidateCommand {
  constructor(
    private readonly logger: Logger
  ) {}

  async execute(): Promise<void> {
    try {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor found. Please open a file to validate.');
        return;
      }

      const document = editor.document;
      const fileName = document.fileName;

      // Check if it's a supported file type
      const supportedExtensions = ['.ts', '.js', '.tsx', '.jsx'];
      const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      if (!supportedExtensions.includes(ext)) {
        vscode.window.showInformationMessage(`EcoLint: Validation is only supported for TypeScript and JavaScript files.`);
        return;
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'EcoLint: Validating code...',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: 'Running validation checks...' });

          const validationAgent = new ValidationAgent(this.logger);

          // Get the current code
          const code = document.getText();

          // Create validation request
          const request: ValidationRequest = {
            fileName: fileName.substring(fileName.lastIndexOf('/') + 1),
            originalCode: code,
            optimizedCode: code, // For now, validate the current code
            language: ext.substring(1), // Remove the leading dot
          };

          // Run validation
          progress.report({ message: 'Running compilation check...' });
          const result = await validationAgent.validate(request);

          // Display results
          progress.report({ message: 'Displaying results...' });
          
          if (result.success) {
            vscode.window.showInformationMessage('✅ EcoLint: Validation passed! No errors found.');
          } else {
            const errorCount = result.summary.totalErrors;
            const warningCount = result.summary.totalWarnings;
            vscode.window.showWarningMessage(
              `⚠️ EcoLint: Validation found ${errorCount} error(s) and ${warningCount} warning(s).`
            );
          }

          // Show detailed results in a webview
          await validationAgent.displaySummary(result);
        }
      );
    } catch (error) {
      this.logger.error('Validation failed', { error });
      vscode.window.showErrorMessage(`EcoLint: Validation failed - ${error}`);
    }
  }
}