/**
 * Benchmark Service
 * 
 * Main service for executing code benchmarks and generating reports.
 * Integrates sandbox execution with carbon estimation.
 */

import { randomUUID } from 'crypto';
import {
  BenchmarkRequest,
  BenchmarkReport,
  SUPPORTED_LANGUAGES,
  LanguageConfig,
} from '../types/benchmark';
import { FormulaCarbonEstimator } from '../carbon';
import { E2BSandboxService, E2BConfig } from './e2bSandboxService';
import { logger } from '../infrastructure/logger';

/**
 * Benchmark Service Configuration
 */
export interface BenchmarkServiceConfig {
  /** Default execution timeout in ms */
  defaultTimeout?: number;
  /** E2B configuration */
  e2b?: E2BConfig;
  /** Grid carbon intensity in gCO₂/kWh */
  gridCarbonIntensity?: number;
}

/**
 * Benchmark execution service
 * 
 * Handles code execution, metric collection, and carbon estimation.
 * Supports both E2B sandbox and local execution.
 */
export class BenchmarkService {
  private readonly defaultTimeout: number;
  private readonly carbonEstimator: FormulaCarbonEstimator;
  private readonly sandboxService: E2BSandboxService;

  /**
   * Create a new BenchmarkService
   * 
   * @param config - Service configuration
   */
  constructor(config: BenchmarkServiceConfig = {}) {
    this.defaultTimeout = config.defaultTimeout ?? 30000;
    this.carbonEstimator = new FormulaCarbonEstimator({
      gridCarbonIntensity: config.gridCarbonIntensity ?? 450,
    });
    
    this.sandboxService = new E2BSandboxService({
      apiKey: config.e2b?.apiKey ?? '',
      timeout: config.e2b?.timeout ?? this.defaultTimeout,
      maxMemory: config.e2b?.maxMemory ?? 512,
    });

    logger.info('BenchmarkService initialized', {
      e2bConfigured: this.sandboxService.isE2BConfigured(),
      defaultTimeout: this.defaultTimeout,
    });
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Object.entries(SUPPORTED_LANGUAGES).map(([key, cfg]) => ({
      ...cfg,
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

    const timeout = request.timeout || this.defaultTimeout;

    logger.info(`Starting benchmark: ${request.name || 'unnamed'}`, {
      language,
      timeout,
    });

    // Execute code in sandbox
    const result = await this.sandboxService.executeInSandbox(
      request.code,
      language,
      timeout
    );

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
      exitCode: report.exitCode,
    });

    return report;
  }

  /**
   * Compare two benchmarks
   * 
   * @param benchmarkA - First benchmark report
   * @param benchmarkB - Second benchmark report
   * @returns Comparison result
   */
  compareBenchmarks(
    benchmarkA: BenchmarkReport,
    benchmarkB: BenchmarkReport
  ): {
    runtimeDiffMs: number;
    runtimeDiffPercent: number;
    memoryDiffMB: number;
    carbonDiffGrams: number;
    winner: 'a' | 'b' | 'tie';
  } {
    const runtimeDiffMs = benchmarkA.runtimeMs - benchmarkB.runtimeMs;
    const runtimeDiffPercent = benchmarkA.runtimeMs > 0
      ? ((benchmarkA.runtimeMs - benchmarkB.runtimeMs) / benchmarkA.runtimeMs) * 100
      : 0;
    const memoryDiffMB = benchmarkA.memoryMB - benchmarkB.memoryMB;
    const carbonDiffGrams = benchmarkA.estimatedCarbonGrams - benchmarkB.estimatedCarbonGrams;

    // Winner is determined by carbon emissions (most eco-friendly)
    let winner: 'a' | 'b' | 'tie';
    if (carbonDiffGrams < 0) {
      winner = 'a';
    } else if (carbonDiffGrams > 0) {
      winner = 'b';
    } else {
      winner = 'tie';
    }

    return {
      runtimeDiffMs,
      runtimeDiffPercent,
      memoryDiffMB,
      carbonDiffGrams,
      winner,
    };
  }

  /**
   * Check if E2B sandbox is configured
   */
  isE2BConfigured(): boolean {
    return this.sandboxService.isE2BConfigured();
  }

  /**
   * Get carbon estimator configuration
   */
  getCarbonEstimatorConfig() {
    return this.carbonEstimator.getConfig();
  }
}