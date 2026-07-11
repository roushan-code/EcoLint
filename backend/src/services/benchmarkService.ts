/**
 * Benchmark Service
 * 
 * Handles code execution and metric collection for benchmarks.
 * Uses child processes to run code and collect performance metrics.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import {
  BenchmarkRequest,
  BenchmarkReport,
  SandboxExecutionResult,
  SUPPORTED_LANGUAGES,
  MetricSnapshot,
  LanguageConfig,
} from '../types/benchmark';
import { FormulaCarbonEstimator } from '../carbon';
import { logger } from '../infrastructure/logger';

/**
 * Benchmark execution service
 * 
 * Handles code execution, metric collection, and carbon estimation.
 */
export class BenchmarkService {
  private readonly tempDir: string;
  private readonly defaultTimeout: number;
  private readonly carbonEstimator: FormulaCarbonEstimator;

  /**
   * Create a new BenchmarkService
   * 
   * @param defaultTimeout - Default execution timeout in ms (default: 30000)
   */
  constructor(defaultTimeout: number = 30000) {
    this.defaultTimeout = defaultTimeout;
    this.carbonEstimator = new FormulaCarbonEstimator();
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecolint-benchmark-'));
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Object.entries(SUPPORTED_LANGUAGES).map(([key, config]) => ({
      ...config,
      name: key,
    }));
  }

  /**
   * Execute a benchmark
   * 
   * @param request - Benchmark request with code and language
   * @returns BenchmarkReport with execution metrics and carbon estimates
   */
  async executeBenchmark(request: BenchmarkRequest): Promise<BenchmarkReport> {
    const language = request.language.toLowerCase();
    const config = SUPPORTED_LANGUAGES[language];

    if (!config) {
      throw new Error(`Unsupported language: ${request.language}`);
    }

    // Create temporary file for code
    const filePath = await this.createTempFile(request.code, config.extension);
    
    try {
      // Execute code and collect metrics
      const result = await this.executeCode(filePath, config, request.timeout || this.defaultTimeout);
      
      // Estimate carbon footprint
      const carbonEstimate = this.carbonEstimator.estimate(
        result.runtime,
        result.averageCpu,
        result.peakMemory
      );

      // Create benchmark report
      const report: BenchmarkReport = {
        id: randomUUID(),
        name: request.name || `Benchmark-${Date.now()}`,
        language: request.language,
        runtimeMs: result.runtime,
        cpuPercent: result.averageCpu,
        memoryMB: result.peakMemory,
        estimatedPowerW: carbonEstimate.powerWatts,
        estimatedEnergyWh: carbonEstimate.energyWattHours,
        estimatedCarbonGrams: carbonEstimate.carbonGrams,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        timestamp: new Date().toISOString(),
        metadata: request.metadata,
      };

      logger.info(`Benchmark completed: ${report.id}`, {
        runtime: report.runtimeMs,
        carbon: report.estimatedCarbonGrams,
      });

      return report;
    } finally {
      // Cleanup temp file
      this.cleanupTempFile(filePath);
    }
  }

  /**
   * Create a temporary file with code
   */
  private async createTempFile(code: string, extension: string): Promise<string> {
    const fileName = `code-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = path.join(this.tempDir, fileName);
    await fs.promises.writeFile(filePath, code, 'utf-8');
    return filePath;
  }

  /**
   * Execute code and collect metrics
   */
  private executeCode(
    filePath: string,
    config: (typeof SUPPORTED_LANGUAGES)[string],
    timeout: number
  ): Promise<SandboxExecutionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const metrics: MetricSnapshot[] = [];
      let stdout = '';
      let stderr = '';
      let peakMemory = 0;
      let totalCpu = 0;
      let cpuSamples = 0;

      // Replace placeholders in args
      const args = config.args.map((arg) =>
        arg.replace('{{file}}', filePath).replace('{{output}}', filePath.replace(/\.[^.]+$/, '.out'))
      );

      const proc = spawn(config.command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        proc.kill('SIGTERM');
      }, timeout);

      // Collect stdout
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      // Collect stderr
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Collect metrics periodically
      const metricsInterval = setInterval(() => {
        if (proc.pid) {
          this.collectMetrics(proc.pid).then((snapshot) => {
            if (snapshot) {
              metrics.push(snapshot);
              peakMemory = Math.max(peakMemory, snapshot.memoryMB);
              totalCpu += snapshot.cpuPercent;
              cpuSamples++;
            }
          }).catch(() => {
            // Ignore errors in metrics collection
          });
        }
      }, 100);

      proc.on('close', (exitCode) => {
        clearTimeout(timeoutHandle);
        clearInterval(metricsInterval);

        const runtime = Date.now() - startTime;
        const averageCpu = cpuSamples > 0 ? totalCpu / cpuSamples : 0;

        resolve({
          stdout,
          stderr,
          exitCode: exitCode ?? -1,
          runtime,
          peakMemory,
          averageCpu,
          metrics,
        });
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        clearInterval(metricsInterval);
        reject(error);
      });
    });
  }

  /**
   * Collect metrics for a process (platform-specific)
   */
  private async collectMetrics(pid: number): Promise<MetricSnapshot | null> {
    // This is a simplified implementation
    // In production, use platform-specific tools like:
    // - Linux: /proc/{pid}/status, ps
    // - macOS: ps, top
    // - Windows: wmic, typeperf
    try {
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        // Windows: Use wmic (simplified)
        return new Promise((resolve) => {
          const proc = spawn('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'WorkingSetSize']);
          let output = '';
          proc.stdout?.on('data', (data) => { output += data.toString(); });
          proc.on('close', () => {
            const match = output.match(/(\d+)/);
            const memoryBytes = match && match[1] ? parseInt(match[1], 10) : 0;
            resolve({
              timestamp: Date.now(),
              cpuPercent: 0, // Would need more complex collection
              memoryMB: Math.round(memoryBytes / (1024 * 1024)),
            });
          });
          proc.on('error', () => resolve(null));
        });
      } else {
        // Unix-like: Use ps
        return new Promise((resolve) => {
          const proc = spawn('ps', ['-p', pid.toString(), '-o', 'rss=']);
          let output = '';
          proc.stdout?.on('data', (data) => { output += data.toString(); });
          proc.on('close', () => {
            const rss = parseInt(output.trim(), 10) || 0;
            resolve({
              timestamp: Date.now(),
              cpuPercent: 0,
              memoryMB: Math.round(rss / 1024),
            });
          });
          proc.on('error', () => resolve(null));
        });
      }
    } catch {
      return null;
    }
  }

  /**
   * Clean up temporary file
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Failed to cleanup temp file: ${filePath}`, { error });
    }
  }

  /**
   * Cleanup all temporary files
   */
  cleanup(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      logger.warn('Failed to cleanup temp directory', { error });
    }
  }
}