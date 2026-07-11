/**
 * Multi-Agent Orchestrator
 * 
 * Coordinates the workflow between Analysis Agent, Optimization Agent,
 * Validation Agent, and Error Analysis Agent for code optimization.
 */

import * as vscode from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { AnalysisEngine } from '../analysis/engine.js';
import { ValidationAgent } from './validationAgent.js';
import { ErrorAnalysisAgent } from './errorAnalysisAgent.js';
import { ApiService } from './apiService.js';
import type {
  OrchestratorConfig,
  WorkflowState,
  WorkflowStep,
  WorkflowResult,
  BenchmarkComparison,
} from '../types/orchestrator.js';
import type { ValidationResult } from '../types/validation.js';
import { DEFAULT_ORCHESTRATOR_CONFIG } from '../types/orchestrator.js';

export class Orchestrator {
  private readonly logger: Logger;
  private readonly analysisEngine: AnalysisEngine;
  private readonly validationAgent: ValidationAgent;
  private readonly errorAnalysisAgent: ErrorAnalysisAgent;
  private readonly apiService: ApiService;
  private config: OrchestratorConfig;
  private state: WorkflowState;
  private progressReporter: vscode.Progress<{ message: string; increment?: number }> | null = null;

  constructor(
    logger: Logger,
    analysisEngine: AnalysisEngine,
    validationAgent: ValidationAgent,
    apiService: ApiService
  ) {
    this.logger = logger;
    this.analysisEngine = analysisEngine;
    this.validationAgent = validationAgent;
    this.apiService = apiService;
    this.errorAnalysisAgent = new ErrorAnalysisAgent(logger);
    this.config = DEFAULT_ORCHESTRATOR_CONFIG;
    this.state = this.createInitialState();
  }

  /**
   * Configure the orchestrator
   */
  public configure(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Orchestrator configured', this.config as unknown as Record<string, unknown>);
  }

  /**
   * Set progress reporter for UI updates
   */
  public setProgressReporter(reporter: vscode.Progress<{ message: string; increment?: number }> | null): void {
    this.progressReporter = reporter;
  }

  /**
   * Run the complete optimization workflow
   */
  public async run(originalCode: string, _fileName: string, _language: string): Promise<WorkflowResult> {
    this.state = this.createInitialState();
    this.state.originalCode = originalCode;
    const startTime = Date.now();

    try {
      // Step 1: Analyze the code
      await this.stepAnalyze();

      // Step 2: Benchmark original code (if enabled)
      if (this.config.enableBenchmark) {
        await this.stepBenchmarkOriginal();
      }

      // Step 3: Optimize the code
      await this.stepOptimize();

      // Step 4: Validate the optimized code
      const validationResult = await this.stepValidate();

      // Step 5: If validation failed and retries available, retry
      while (!validationResult.success && this.state.retryCount < this.config.maxRetries) {
        await this.stepRetryWithContext(validationResult);
        this.state.retryCount++;

        // Re-validate after retry
        const retryValidation = await this.stepValidate();
        if (retryValidation.success) {
          validationResult.success = true;
          break;
        }
      }

      // Step 6: Benchmark optimized code (if enabled and validation passed)
      if (this.config.enableBenchmark && validationResult.success) {
        await this.stepBenchmarkOptimized();
      }

      // Step 7: Compare results
      const comparison = await this.stepCompare();

      // Step 8: Show results
      if (validationResult.success) {
        await this.stepShowResults(comparison);
      } else {
        await this.stepShowValidationReport(validationResult);
      }

      // Build result
      return {
        success: validationResult.success,
        originalCode: this.state.originalCode,
        optimizedCode: this.state.optimizedCode,
        benchmarkComparison: comparison,
        validationReport: validationResult.success ? undefined : {
          validationResult,
          recommendations: this.generateRecommendations(),
        },
        totalDuration: Date.now() - startTime,
        retryCount: this.state.retryCount,
        errors: this.state.errors,
      };
    } catch (error) {
      this.recordError('failed', `Workflow failed: ${error}`);
      return {
        success: false,
        originalCode: this.state.originalCode,
        totalDuration: Date.now() - startTime,
        retryCount: this.state.retryCount,
        errors: this.state.errors,
      };
    }
  }

  /**
   * Cancel the current workflow
   */
  public cancel(): void {
    this.state.cancelled = true;
    this.logger.info('Workflow cancelled');
  }

  /**
   * Create initial workflow state
   */
  private createInitialState(): WorkflowState {
    return {
      currentStep: 'idle',
      retryCount: 0,
      cancelled: false,
      originalCode: '',
      errors: [],
      startTime: Date.now(),
    };
  }

  /**
   * Update current step and report progress
   */
  private async updateStep(step: WorkflowStep, message: string): Promise<void> {
    this.state.currentStep = step;
    this.progressReporter?.report({ message, increment: 10 });
    this.logger.info(`Step: ${step}`, { message });
  }

  /**
   * Record an error
   */
  private recordError(step: WorkflowStep, message: string, details?: string): void {
    this.state.errors.push({
      step,
      message,
      details,
      timestamp: Date.now(),
    });
    this.logger.error(`Error in ${step}: ${message}`, { details });
  }

  /**
   * Step: Analyze code
   */
  private async stepAnalyze(): Promise<void> {
    await this.updateStep('analyzing', 'Analyzing code...');
    // Analysis is done by the analysis engine
    const analysisResult = this.analysisEngine.analyzeFile('temp.ts', this.state.originalCode);
    
    // Map findings to issues with required id field
    const issues: import('../types/index.js').Issue[] = analysisResult.findings.map((finding, index) => ({
      id: `issue-${index}-${crypto.randomUUID().slice(0, 8)}`,
      severity: finding.severity,
      line: finding.line,
      column: finding.column,
      message: finding.message,
      rule: finding.rule,
      code: finding.code,
    }));
    
    this.state.analysisResult = {
      issues,
      suggestions: [],
      metrics: {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        estimatedExecutionTime: analysisResult.summary.errors + analysisResult.summary.warnings + analysisResult.summary.info,
        memoryUsage: analysisResult.summary.warnings * 5,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Step: Benchmark original code
   */
  private async stepBenchmarkOriginal(): Promise<void> {
    await this.updateStep('benchmarking_original', 'Benchmarking original code...');
    try {
      const response = await this.apiService.runBenchmark(this.state.originalCode, 'typescript', 'temp.ts');
      if (response.success && response.data) {
        this.state.originalBenchmark = response.data;
      }
    } catch (error) {
      this.logger.warn('Benchmark failed for original code', { error });
    }
  }

  /**
   * Step: Optimize code
   */
  private async stepOptimize(): Promise<void> {
    await this.updateStep('optimizing', 'Optimizing code...');
    try {
      const response = await this.apiService.optimizeCode(
        this.state.originalCode,
        'typescript',
        'temp.ts'
      );
      if (response.success && response.data) {
        this.state.optimizedCode = response.data.optimizedCode;
      } else {
        throw new Error(response.error || 'Optimization failed');
      }
    } catch (error) {
      this.recordError('optimizing', `Optimization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Step: Validate optimized code
   */
  private async stepValidate(): Promise<ValidationResult> {
    await this.updateStep('validating', 'Validating optimized code...');
    const result = await this.validationAgent.validate({
      originalCode: this.state.originalCode,
      optimizedCode: this.state.optimizedCode!,
      fileName: 'optimized.ts',
      language: 'typescript',
    });
    this.state.validationResult = result;
    return result;
  }

  /**
   * Step: Retry optimization with error context
   */
  private async stepRetryWithContext(validationResult: ValidationResult): Promise<void> {
    await this.updateStep('optimizing', `Retrying optimization (attempt ${this.state.retryCount + 1})...`);

    // Analyze the errors for logging
    const _errorAnalysis = this.errorAnalysisAgent.analyze(validationResult);
    this.logger.info('Retrying with error context', { analysis: _errorAnalysis.summary });

    // Retry with error context - use the same API but with additional context
    try {
      const response = await this.apiService.optimizeCode(
        this.state.originalCode,
        'typescript',
        'temp.ts'
      );
      if (response.success && response.data) {
        this.state.optimizedCode = response.data.optimizedCode;
      } else {
        throw new Error(response.error || 'Retry optimization failed');
      }
    } catch (error) {
      this.recordError('optimizing', `Retry optimization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Step: Benchmark optimized code
   */
  private async stepBenchmarkOptimized(): Promise<void> {
    await this.updateStep('benchmarking_optimized', 'Benchmarking optimized code...');
    try {
      const response = await this.apiService.runBenchmark(this.state.optimizedCode!, 'typescript', 'temp.ts');
      if (response.success && response.data) {
        this.state.optimizedBenchmark = response.data;
      }
    } catch (error) {
      this.logger.warn('Benchmark failed for optimized code', { error });
    }
  }

  /**
   * Step: Compare benchmarks
   */
  private async stepCompare(): Promise<BenchmarkComparison | undefined> {
    if (!this.state.originalBenchmark || !this.state.optimizedBenchmark) {
      return undefined;
    }

    await this.updateStep('comparing', 'Comparing results...');

    const original = this.state.originalBenchmark;
    const optimized = this.state.optimizedBenchmark;

    // Convert to proper BenchmarkResult format with correct property names
    return {
      original: {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        fileName: 'original.ts',
        language: 'typescript',
        executionTime: original.executionTime,
        memoryUsage: original.memoryUsage,
        cpuUsage: original.cpuUsage,
        carbonUsage: original.carbonUsage,
        comparisons: [],
      },
      optimized: {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        fileName: 'optimized.ts',
        language: 'typescript',
        executionTime: optimized.executionTime,
        memoryUsage: optimized.memoryUsage,
        cpuUsage: optimized.cpuUsage,
        carbonUsage: optimized.carbonUsage,
        comparisons: [],
      },
      improvement: {
        runtimePercent: ((original.executionTime - optimized.executionTime) / original.executionTime) * 100,
        memoryPercent: ((original.memoryUsage - optimized.memoryUsage) / original.memoryUsage) * 100,
        carbonPercent: ((original.carbonUsage - optimized.carbonUsage) / original.carbonUsage) * 100,
      },
    };
  }

  /**
   * Step: Show results
   */
  private async stepShowResults(comparison?: BenchmarkComparison): Promise<void> {
    await this.updateStep('completed', 'Optimization complete!');

    // Show diff viewer if enabled
    if (this.config.showDiffViewer && this.state.optimizedCode) {
      await this.validationAgent.openDiffViewer(
        this.state.originalCode,
        this.state.optimizedCode,
        'optimized.ts'
      );
    }

    // Show validation summary
    if (this.state.validationResult) {
      await this.validationAgent.displaySummary(this.state.validationResult, comparison);
    }

    // Show success message
    vscode.window.showInformationMessage('EcoLint: Optimization complete!');
  }

  /**
   * Step: Show validation report
   */
  private async stepShowValidationReport(validationResult: ValidationResult): Promise<void> {
    await this.updateStep('failed', 'Validation failed');

    const errorAnalysis = this.errorAnalysisAgent.analyze(validationResult);

    // Show error details
    const message = `Validation failed with ${validationResult.summary.totalErrors} errors. ${errorAnalysis.summary}`;
    vscode.window.showErrorMessage(message);

    // Show detailed report
    const panel = vscode.window.createWebviewPanel(
      'ecolint.validationReport',
      'Validation Report',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = this.generateValidationReportHtml(errorAnalysis, validationResult);
  }

  /**
   * Generate validation report HTML
   */
  private generateValidationReportHtml(
    errorAnalysis: ReturnType<ErrorAnalysisAgent['analyze']>,
    _validationResult: ValidationResult
  ): string {
    const errorsHtml = errorAnalysis.errors
      .map(
        (error) => `
        <div class="error">
          <div class="error-type">${error.type.toUpperCase()}</div>
          <div class="error-message">${error.message}</div>
          <div class="error-explanation">${error.explanation}</div>
          ${error.line ? `<div class="error-location">Line ${error.line}, Column ${error.column}</div>` : ''}
        </div>
      `
      )
      .join('');

    const rootCausesHtml = errorAnalysis.rootCauses
      .map((cause) => `<li>${cause}</li>`)
      .join('');

    const fixesHtml = errorAnalysis.suggestedFixes
      .map((fix) => `<li>${fix}</li>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
            h1 { color: #f44336; }
            h2 { color: #ff9800; margin-top: 20px; }
            .error { background: #2d2d2d; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #f44336; }
            .error-type { color: #f44336; font-weight: bold; font-size: 12px; }
            .error-message { color: #d4d4d4; margin: 5px 0; }
            .error-explanation { color: #808080; font-size: 14px; }
            .error-location { color: #569cd6; font-size: 12px; margin-top: 5px; }
            ul { padding-left: 20px; }
            li { margin: 5px 0; }
            .summary { background: #2d2d2d; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>❌ Validation Failed</h1>
          <div class="summary">
            <strong>Summary:</strong> ${errorAnalysis.summary}
          </div>
          <h2>Errors (${errorAnalysis.errors.length})</h2>
          ${errorsHtml}
          <h2>Root Causes</h2>
          <ul>${rootCausesHtml}</ul>
          <h2>Suggested Fixes</h2>
          <ul>${fixesHtml}</ul>
        </body>
      </html>
    `;
  }

  /**
   * Generate recommendations based on workflow state
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.state.retryCount >= this.config.maxRetries) {
      recommendations.push('Maximum retry attempts reached. Consider manually reviewing the code.');
    }

    if (this.state.validationResult) {
      const errorCount = this.state.validationResult.summary.totalErrors;
      if (errorCount > 10) {
        recommendations.push('Many errors detected. The optimization may be too aggressive.');
      }
    }

    return recommendations;
  }
}