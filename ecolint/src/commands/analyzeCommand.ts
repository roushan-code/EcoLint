import { OutputChannel, window } from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { ApiService } from '../services/apiService.js';

export class AnalyzeCommand {
  private readonly logger: Logger;
  private readonly outputChannel: OutputChannel;
  private readonly apiService: ApiService;

  constructor(logger: Logger, outputChannel: OutputChannel) {
    this.logger = logger;
    this.outputChannel = outputChannel;
    this.apiService = new ApiService(logger);
  }

  public async execute(): Promise<void> {
    this.logger.info('Executing Analyze command...');

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

    this.outputChannel.appendLine(`[EcoLint] Analyzing ${language} code...`);
    this.outputChannel.appendLine(`File: ${fileName}`);
    this.outputChannel.appendLine('---');

    try {
      const response = await this.apiService.analyzeCode(code, language, fileName);

      if (response.success && response.data) {
        this.outputChannel.appendLine(`[EcoLint] Analysis complete!`);
        this.outputChannel.appendLine(`Issues found: ${response.data.issues.length}`);
        this.outputChannel.appendLine(`Suggestions: ${response.data.suggestions.length}`);
        this.logger.info('Analyze command completed', { language, fileName });
      } else {
        this.outputChannel.appendLine(`[EcoLint] Analysis failed: ${response.error}`);
        this.logger.error('Analysis failed', response.error);
      }
    } catch (error) {
      this.logger.error('Analysis failed', error);
      this.outputChannel.appendLine(`[EcoLint] Analysis failed: ${error}`);
      throw error;
    }
  }
}