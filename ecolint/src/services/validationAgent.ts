/**
 * Validation Agent
 * 
 * Validates optimized code by running compilation, linting, and tests.
 * Opens diff viewer on success, returns structured errors on failure.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../infrastructure/logger.js';
import type {
  ValidationResult,
  ValidationCheck,
  ValidationError,
  ValidationRequest,
  BenchmarkComparison,
} from '../types/validation.js';

const execAsync = promisify(exec);

export class ValidationAgent {
  private readonly logger: Logger;
  private readonly workspaceRoot: string | undefined;

  constructor(logger: Logger) {
    this.logger = logger;
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * Run all validation checks on the optimized code
   */
  public async validate(request: ValidationRequest): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];
    const startTime = Date.now();

    this.logger.info('Starting validation', { fileName: request.fileName });

    // Create temporary files for validation
    const tempDir = path.join(this.workspaceRoot || '.', '.ecolint-temp');
    const originalPath = path.join(tempDir, `original_${request.fileName}`);
    const optimizedPath = path.join(tempDir, `optimized_${request.fileName}`);

    try {
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write files for validation
      fs.writeFileSync(originalPath, request.originalCode);
      fs.writeFileSync(optimizedPath, request.optimizedCode);

      // Run validation checks
      const compilationCheck = await this.runCompilationCheck(optimizedPath);
      checks.push(compilationCheck);

      const lintingCheck = await this.runLintingCheck(optimizedPath);
      checks.push(lintingCheck);

      const testCheck = await this.runTestCheck();
      checks.push(testCheck);

      // Calculate summary
      const totalErrors = checks.reduce((sum, c) => sum + c.errors.length, 0);
      const totalWarnings = checks.reduce((sum, c) => sum + c.warnings.length, 0);
      const totalDuration = Date.now() - startTime;

      const result: ValidationResult = {
        success: totalErrors === 0,
        checks,
        summary: {
          totalErrors,
          totalWarnings,
          totalDuration,
        },
      };

      this.logger.info('Validation completed', {
        success: result.success,
        errors: totalErrors,
        warnings: totalWarnings,
      });

      return result;
    } finally {
      // Cleanup temp files
      this.cleanupTempFiles(tempDir);
    }
  }

  /**
   * Run TypeScript compilation check
   */
  private async runCompilationCheck(_filePath: string): Promise<ValidationCheck> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Run tsc --noEmit to check for compilation errors
      const { stdout, stderr } = await execAsync(
        `npx tsc --noEmit --project "${this.workspaceRoot}/tsconfig.json" 2>&1`,
        { cwd: this.workspaceRoot, timeout: 60000 }
      );

      // Parse TypeScript errors
      const output = stdout + stderr;
      const tsErrors = this.parseTypeScriptErrors(output);
      errors.push(...tsErrors.errors);
      warnings.push(...tsErrors.warnings);
    } catch (error: unknown) {
      // TypeScript compilation failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      const tsErrors = this.parseTypeScriptErrors(errorMessage);
      errors.push(...tsErrors.errors);
      warnings.push(...tsErrors.warnings);

      // If no specific errors parsed, add a generic error
      if (errors.length === 0 && tsErrors.errors.length === 0) {
        errors.push({
          type: 'compilation',
          message: `Compilation failed: ${errorMessage}`,
          severity: 'error',
        });
      }
    }

    return {
      name: 'Compilation Check',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }

  /**
   * Run ESLint check
   */
  private async runLintingCheck(filePath: string): Promise<ValidationCheck> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Run eslint on the file
      const { stdout, stderr } = await execAsync(
        `npx eslint "${filePath}" --format json 2>&1`,
        { cwd: this.workspaceRoot, timeout: 60000 }
      );

      const output = stdout + stderr;
      const lintErrors = this.parseEslintErrors(output);
      errors.push(...lintErrors.errors);
      warnings.push(...lintErrors.warnings);
    } catch (error: unknown) {
      // ESLint may return non-zero exit code even with warnings
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's just warnings (exit code 0 or 1) vs actual errors (exit code 2)
      if (errorMessage.includes('exit code 2')) {
        const lintErrors = this.parseEslintErrors(errorMessage);
        errors.push(...lintErrors.errors);
        warnings.push(...lintErrors.warnings);
      } else {
        // Parse warnings from the output
        const lintErrors = this.parseEslintErrors(errorMessage);
        warnings.push(...lintErrors.warnings);
      }
    }

    return {
      name: 'Linting Check',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }

  /**
   * Run tests
   */
  private async runTestCheck(): Promise<ValidationCheck> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Run npm test or yarn test
      const packageManager = await this.detectPackageManager();
      const testCommand = packageManager === 'yarn' ? 'yarn test' : 'npm test';

      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: this.workspaceRoot,
        timeout: 120000,
      });

      // Check for test failures in output
      const testOutput = stdout + stderr;
      if (testOutput.includes('FAIL') || testOutput.includes('failed')) {
        const testErrors = this.parseTestErrors(testOutput);
        errors.push(...testErrors);
      }
    } catch (error: unknown) {
      // Tests failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      const testErrors = this.parseTestErrors(errorMessage);
      errors.push(...testErrors);

      if (errors.length === 0) {
        errors.push({
          type: 'test',
          message: `Tests failed: ${errorMessage}`,
          severity: 'error',
        });
      }
    }

    return {
      name: 'Test Check',
      passed: errors.length === 0,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }

  /**
   * Parse TypeScript compiler errors
   */
  private parseTypeScriptErrors(output: string): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // TypeScript error format: file.ts(line,col): error TSxxxx: message
    const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)$/gm;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
      const [, file, line, column, severity, message] = match;
      if (!file || !line || !column || !severity || !message) { continue; }
      const error: ValidationError = {
        type: 'compilation',
        file: file.trim(),
        line: parseInt(line, 10),
        column: parseInt(column, 10),
        message: message.trim(),
        severity: severity as 'error' | 'warning',
      };

      if (severity === 'error') {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }

    return { errors, warnings };
  }

  /**
   * Parse ESLint JSON output
   */
  private parseEslintErrors(output: string): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Try to parse as JSON
      const jsonOutput = JSON.parse(output);
      const messages = Array.isArray(jsonOutput) ? jsonOutput : jsonOutput.results?.[0]?.messages || [];

      for (const msg of messages) {
        const error: ValidationError = {
          type: 'linting',
          file: msg.filePath || msg.filename,
          line: msg.line,
          column: msg.column,
          message: msg.message,
          severity: msg.severity === 2 ? 'error' : 'warning',
        };

        if (msg.severity === 2) {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      }
    } catch {
      // Fallback: parse as plain text
      const eslintRegex = /^(.+?):(\d+):(\d+):\s+(.+?)\s+(.+)$/gm;
      let match;

      while ((match = eslintRegex.exec(output)) !== null) {
        const [, file, line, column, severity, message] = match;
        if (!file || !line || !column || !severity || !message) { continue; }
        const error: ValidationError = {
          type: 'linting',
          file: file.trim(),
          line: parseInt(line, 10),
          column: parseInt(column, 10),
          message: message.trim(),
          severity: severity.toLowerCase().includes('error') ? 'error' : 'warning',
        };

        if (error.severity === 'error') {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Parse test output for failures
   */
  private parseTestErrors(output: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Match test failure patterns
    const failureRegex = /FAIL\s+(.+?)\s*\n.*?(\d+)\s+failed/g;
    let match;

    while ((match = failureRegex.exec(output)) !== null) {
      errors.push({
        type: 'test',
        file: match[1],
        message: `${match[2]} test(s) failed`,
        severity: 'error',
      });
    }

    // Also check for specific assertion failures
    const assertionRegex = /Expected:\s*(.+)\n\s+Received:\s*(.+)/g;
    while ((match = assertionRegex.exec(output)) !== null) {
      errors.push({
        type: 'test',
        message: `Assertion failed: Expected ${match[1]}, Received ${match[2]}`,
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Detect package manager (yarn or npm)
   */
  private async detectPackageManager(): Promise<'yarn' | 'npm'> {
    try {
      // Check if yarn.lock exists
      const yarnLockPath = path.join(this.workspaceRoot || '.', 'yarn.lock');
      if (fs.existsSync(yarnLockPath)) {
        return 'yarn';
      }
    } catch {
      // Fallback to npm
    }
    return 'npm';
  }

  /**
   * Cleanup temporary files
   */
  private cleanupTempFiles(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.warn('Failed to cleanup temp files', { error });
    }
  }

  /**
   * Open VS Code diff viewer with original and optimized code
   */
  public async openDiffViewer(
    originalCode: string,
    optimizedCode: string,
    fileName: string
  ): Promise<void> {
    // Create virtual documents
    const originalDoc = await vscode.workspace.openTextDocument({
      content: originalCode,
      language: this.getLanguageId(fileName),
    });

    const optimizedDoc = await vscode.workspace.openTextDocument({
      content: optimizedCode,
      language: this.getLanguageId(fileName),
    });

    // Open diff viewer
    await vscode.commands.executeCommand('vscode.diff', originalDoc.uri, optimizedDoc.uri, `EcoLint: ${fileName}`);
  }

  /**
   * Get language ID from file extension
   */
  private getLanguageId(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.tsx': 'typescriptreact',
      '.jsx': 'javascriptreact',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
    };
    return languageMap[ext] || 'plaintext';
  }

  /**
   * Display validation summary in a webview panel
   */
  public async displaySummary(
    result: ValidationResult,
    benchmarkComparison?: BenchmarkComparison
  ): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'ecolint.validationSummary',
      'Validation Summary',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    const html = this.generateSummaryHtml(result, benchmarkComparison);
    panel.webview.html = html;
  }

  /**
   * Generate HTML for validation summary
   */
  private generateSummaryHtml(result: ValidationResult, comparison?: BenchmarkComparison): string {
    const statusColor = result.success ? '#4caf50' : '#f44336';
    const statusText = result.success ? 'PASSED' : 'FAILED';

    let benchmarkHtml = '';
    if (comparison) {
      benchmarkHtml = `
        <div class="section">
          <h2>📊 Benchmark Comparison</h2>
          <table>
            <tr><th>Metric</th><th>Original</th><th>Optimized</th><th>Improvement</th></tr>
            <tr>
              <td>Runtime</td>
              <td>${comparison.original.runtimeMs.toFixed(2)} ms</td>
              <td>${comparison.optimized.runtimeMs.toFixed(2)} ms</td>
              <td class="improvement">${comparison.improvement.runtimePercent.toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Memory</td>
              <td>${comparison.original.memoryMB.toFixed(2)} MB</td>
              <td>${comparison.optimized.memoryMB.toFixed(2)} MB</td>
              <td class="improvement">${comparison.improvement.memoryPercent.toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Carbon</td>
              <td>${comparison.original.estimatedCarbonGrams.toFixed(4)} g</td>
              <td>${comparison.optimized.estimatedCarbonGrams.toFixed(4)} g</td>
              <td class="improvement">${comparison.improvement.carbonPercent.toFixed(1)}%</td>
            </tr>
          </table>
        </div>
      `;
    }

    const checksHtml = result.checks
      .map(
        (check) => `
        <div class="check ${check.passed ? 'passed' : 'failed'}">
          <span class="icon">${check.passed ? '✅' : '❌'}</span>
          <span class="name">${check.name}</span>
          <span class="duration">${check.duration}ms</span>
          ${check.errors.length > 0 ? `<span class="errors">${check.errors.length} errors</span>` : ''}
          ${check.warnings.length > 0 ? `<span class="warnings">${check.warnings.length} warnings</span>` : ''}
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
            .status { font-size: 24px; font-weight: bold; color: ${statusColor}; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section h2 { color: #569cd6; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #333; }
            th { color: #9cdcfe; }
            .improvement { color: #4caf50; font-weight: bold; }
            .check { display: flex; align-items: center; gap: 10px; padding: 8px; margin: 4px 0; border-radius: 4px; background: #2d2d2d; }
            .check.passed { border-left: 3px solid #4caf50; }
            .check.failed { border-left: 3px solid #f44336; }
            .icon { font-size: 16px; }
            .name { flex: 1; }
            .duration { color: #808080; }
            .errors { color: #f44336; }
            .warnings { color: #ff9800; }
            .summary { margin-top: 20px; padding: 15px; background: #2d2d2d; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="status">${statusText}</div>
          ${benchmarkHtml}
          <div class="section">
            <h2>🔍 Validation Checks</h2>
            ${checksHtml}
          </div>
          <div class="summary">
            <strong>Summary:</strong> ${result.summary.totalErrors} errors, ${result.summary.totalWarnings} warnings in ${result.summary.totalDuration}ms
          </div>
        </body>
      </html>
    `;
  }
}