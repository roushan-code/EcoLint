import { OutputChannel, window } from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { ApiService } from '../services/apiService.js';

export class BenchmarkCommand {
  private readonly logger: Logger;
  private readonly outputChannel: OutputChannel;
  private readonly apiService: ApiService;

  constructor(logger: Logger, outputChannel: OutputChannel) {
    this.logger = logger;
    this.outputChannel = outputChannel;
    this.apiService = new ApiService(logger);
  }

  public async execute(): Promise<void> {
    this.logger.info('Executing Benchmark command...');

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

    const codeExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.cs', '.vue', '.svelte'];
    const isCodeFile = codeExts.some(ext => fileName.endsWith(ext));
    
    if (!isCodeFile) {
      this.logger.warn('Skipping non-code file', { language, fileName });
      void window.showInformationMessage('Please open a code file to benchmark');
      return;
    }
    
    if (!code.trim()) {
      this.logger.warn('Empty file');
      void window.showInformationMessage('The file is empty');
      return;
    }

    this.outputChannel.appendLine(`[EcoLint] Running benchmarks for ${language} code...`);
    this.outputChannel.appendLine(`File: ${fileName}`);
    this.outputChannel.appendLine('---');

    try {
      const response = await this.apiService.runBenchmark(code, language, fileName);

      if (response.success && response.data) {
        this.outputChannel.appendLine(`[EcoLint] Benchmark complete!`);
        this.outputChannel.appendLine(`Execution time: ${response.data.runtimeMs}ms`);
        this.outputChannel.appendLine(`Memory usage: ${response.data.memoryMB}MB`);
        this.outputChannel.appendLine(`Carbon emissions: ${response.data.estimatedCarbonGrams}g CO₂`);
        this.outputChannel.appendLine(`Exit code: ${response.data.exitCode}`);
        if (response.data.stdout) {
          this.outputChannel.appendLine(`---`);
          this.outputChannel.appendLine(`Output: ${response.data.stdout}`);
        }
        this.logger.info('Benchmark command completed', { language, fileName });
      } else {
        this.outputChannel.appendLine(`[EcoLint] Benchmark failed: ${response.error}`);
        this.logger.error('Benchmark failed', response.error);
      }
    } catch (error) {
      this.logger.error('Benchmark failed', error);
      this.outputChannel.appendLine(`[EcoLint] Benchmark failed: ${error}`);
      throw error;
    }
  }
}