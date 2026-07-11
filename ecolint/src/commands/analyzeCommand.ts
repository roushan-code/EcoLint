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
    const language = document.languageId;
    const fileName = document.fileName;

    // Skip only clearly non-code files (output panels, etc.)
    const invalidLanguages = ['code-runner-output'];
    const invalidExtensions = ['.log', '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.html', '.css'];
    
    if (invalidLanguages.includes(language) || invalidExtensions.some(ext => fileName.endsWith(ext))) {
      this.logger.warn('Skipping non-code file', { language, fileName });
      void window.showInformationMessage('Please open a code file to analyze');
      return;
    }

    const code = document.getText();
    
    if (!code.trim()) {
      this.logger.warn('Empty file');
      void window.showInformationMessage('The file is empty');
      return;
    }

    this.outputChannel.appendLine(`[EcoLint] Analyzing ${language} code...`);
    this.outputChannel.appendLine(`File: ${fileName}`);
    this.outputChannel.appendLine('---');

    try {
      const response = await this.apiService.analyzeCode(code, language, fileName);

      if (response.success && response.data) {
        const issues = response.data.issues || [];
        const suggestions = response.data.suggestions || [];
        const metrics = response.data.metrics;
        
        this.outputChannel.appendLine(`[EcoLint] Analysis Complete!`);
        this.outputChannel.appendLine('='.repeat(50));
        
        // Show metrics if available
        if (metrics) {
          this.outputChannel.appendLine('\n📊 Code Metrics:');
          this.outputChannel.appendLine(`  Time Complexity: ${metrics.timeComplexity || 'N/A'}`);
          this.outputChannel.appendLine(`  Space Complexity: ${metrics.spaceComplexity || 'N/A'}`);
          this.outputChannel.appendLine(`  Estimated Execution Time: ${metrics.estimatedExecutionTime || 'N/A'} ms`);
          this.outputChannel.appendLine(`  Memory Usage: ${metrics.memoryUsage || 'N/A'} KB`);
        }
        
        // Show score
        if (response.data.score !== undefined) {
          this.outputChannel.appendLine(`\n📈 Code Quality Score: ${response.data.score}/100`);
        }
        
        // Show issues
        this.outputChannel.appendLine(`\n❌ Issues Found: ${issues.length}`);
        if (issues.length > 0) {
          for (const issue of issues) {
            this.outputChannel.appendLine(`  [${issue.severity.toUpperCase()}] Line ${issue.line}: ${issue.message}`);
            if (issue.rule) {
              this.outputChannel.appendLine(`    Rule: ${issue.rule}`);
            }
          }
        }
        
        // Show suggestions
        this.outputChannel.appendLine(`\n💡 Suggestions: ${suggestions.length}`);
        if (suggestions.length > 0) {
          for (const suggestion of suggestions) {
            this.outputChannel.appendLine(`  [${suggestion.type}] ${suggestion.message}`);
            this.outputChannel.appendLine(`    Explanation: ${suggestion.explanation}`);
          }
        }
        
        this.outputChannel.appendLine('\n' + '='.repeat(50));
        this.outputChannel.appendLine('[EcoLint] Analysis complete!');
        this.logger.info('Analyze command completed', { language, fileName });
      } else {
        const errorMsg = response.error || 'Unknown error';
        this.outputChannel.appendLine(`[EcoLint] Analysis failed: ${errorMsg}`);
        this.logger.error('Analysis failed', errorMsg);
      }
    } catch (error) {
      this.logger.error('Analysis failed', error);
      this.outputChannel.appendLine(`[EcoLint] Analysis failed: ${error}`);
    }
  }
}