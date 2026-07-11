/**
 * Orchestrator Command
 * 
 * VS Code command handler for running the code optimization workflow.
 */

import * as vscode from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { Orchestrator } from '../services/orchestrator.js';
import { AnalysisEngine } from '../analysis/engine.js';
import { ValidationAgent } from '../services/validationAgent.js';
import { ApiService } from '../services/apiService.js';
import type { WorkflowResult } from '../types/orchestrator.js';

export class OrchestratorCommand {
  private readonly logger: Logger;
  private readonly orchestrator: Orchestrator;

  constructor(
    logger: Logger,
    analysisEngine: AnalysisEngine,
    validationAgent: ValidationAgent,
    apiService: ApiService
  ) {
    this.logger = logger;
    this.orchestrator = new Orchestrator(logger, analysisEngine, validationAgent, apiService);
  }

  /**
   * Register the command with VS Code
   */
  public register(context: vscode.ExtensionContext): void {
    const command = vscode.commands.registerCommand(
      'ecolint.runOptimization',
      async () => {
        await this.execute();
      }
    );

    context.subscriptions.push(command);
    this.logger.info('OrchestratorCommand registered');
  }

  /**
   * Execute the optimization workflow
   */
  public async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found. Please open a file to optimize.');
      return;
    }

    const document = editor.document;
    const originalCode = document.getText();
    const fileName = document.fileName;
    const language = document.languageId;

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'EcoLint Optimization',
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          this.orchestrator.cancel();
        });

        this.orchestrator.setProgressReporter(progress);

        try {
          const result = await this.orchestrator.run(originalCode, fileName, language);
          this.displayResult(result);
        } catch (error) {
          this.logger.error('Optimization failed', { error });
          vscode.window.showErrorMessage(`Optimization failed: ${error}`);
        }
      }
    );
  }

  /**
   * Display the workflow result
   */
  private displayResult(result: WorkflowResult): void {
    if (result.success) {
      const message = `Optimization complete! Duration: ${result.totalDuration}ms`;
      vscode.window.showInformationMessage(message);
    } else {
      const errorCount = result.errors?.length || 0;
      const message = `Optimization failed with ${errorCount} error(s). Check the validation report for details.`;
      vscode.window.showWarningMessage(message);
    }
  }
}