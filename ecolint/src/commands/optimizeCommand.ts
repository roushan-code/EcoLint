import { OutputChannel, window } from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { ApiService } from '../services/apiService.js';

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
        this.outputChannel.appendLine(`[EcoLint] Optimization complete!`);
        this.outputChannel.appendLine(`Improvements: ${response.data.improvements.length}`);
        this.logger.info('Optimize command completed', { language, fileName });
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