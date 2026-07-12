import { OutputChannel, window, workspace, Range, Position } from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { ApiService } from '../services/apiService.js';
import { showDiffCommand } from './diffCommand.js';

export class OptimizeCommand {
  private readonly logger: Logger;
  private readonly outputChannel: OutputChannel;
  private readonly apiService: ApiService;

  constructor(logger: Logger, outputChannel: OutputChannel) {
    this.logger = logger;
    this.outputChannel = outputChannel;
    this.apiService = new ApiService(logger);
  }

  public async execute(): Promise<void> {
    this.logger.info('Executing Optimize command...');

    const editor = window.activeTextEditor;
    if (!editor) {
      this.logger.warn('No active text editor found');
      void window.showInformationMessage('No active text editor found');
      return;
    }

    const document = editor.document;
    const code = document.getText();
    const language = document.languageId;
    const fileName = document.fileName;

    this.outputChannel.appendLine(`[EcoLint] Optimizing ${language} code...`);
    this.outputChannel.appendLine(`File: ${fileName}`);
    this.outputChannel.appendLine('---');

    try {
      const response = await this.apiService.optimizeCode(code, language, fileName);

      if (response.success && response.data) {
        const { optimizedCode, improvements, carbonSavings, retries } = response.data;
        
        this.outputChannel.appendLine(`[EcoLint] Optimization complete!`);
        this.outputChannel.appendLine(`Improvements: ${improvements.length}`);
        
        // Show improvements in output
        improvements.forEach((improvement, index) => {
          this.outputChannel.appendLine(`  ${index + 1}. [${improvement.type.toUpperCase()}] ${improvement.description}`);
        });
        
        // Show carbon savings if available
        if (carbonSavings) {
          this.outputChannel.appendLine('');
          this.outputChannel.appendLine('[EcoLint] Carbon Savings:');
          this.outputChannel.appendLine(`  Original execution time: ${carbonSavings.originalExecutionTime}ms`);
          this.outputChannel.appendLine(`  Optimized execution time: ${carbonSavings.optimizedExecutionTime}ms`);
          this.outputChannel.appendLine(`  Time savings: ${carbonSavings.timeSavingsPercent.toFixed(2)}%`);
          this.outputChannel.appendLine(`  Carbon saved: ${carbonSavings.carbonSaved.toFixed(4)}g CO2`);
        }
        
        if (retries !== undefined && retries > 0) {
          this.outputChannel.appendLine(`  (Completed after ${retries + 1} attempt(s))`);
        }
        
        // Check if there are actual changes
        if (optimizedCode !== code) {
          // Ask user if they want to apply the changes
          const choice = await window.showInformationMessage(
            `Found ${improvements.length} optimization(s). Would you like to see the diff?`,
            'Show Diff',
            'Apply All',
            'Cancel'
          );

          if (choice === 'Show Diff') {
            // Show diff view
            await showDiffCommand(code, optimizedCode, fileName);
          } else if (choice === 'Apply All') {
            // Apply optimized code to editor
            const fullRange = new Range(
              new Position(0, 0),
              document.positionAt(document.getText().length)
            );
            const edit = new (await import('vscode')).WorkspaceEdit();
            edit.replace(document.uri, fullRange, optimizedCode);
            await workspace.applyEdit(edit);
            await document.save();
            this.outputChannel.appendLine('[EcoLint] Optimized code applied!');
            void window.showInformationMessage('EcoLint: Optimized code applied!');
          }
        } else {
          this.outputChannel.appendLine('[EcoLint] No changes needed - code is already optimized!');
        }
        
        this.logger.info('Optimize command completed', { language, fileName, improvementsCount: improvements.length });
      } else {
        this.outputChannel.appendLine(`[EcoLint] Optimization failed: ${response.error}`);
        this.logger.error('Optimization failed', response.error);
      }
    } catch (error) {
      this.logger.error('Optimization failed', error);
      this.outputChannel.appendLine(`[EcoLint] Optimization failed: ${error}`);
      throw error;
    }
  }
}
