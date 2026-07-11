/**
 * Benchmark Types
 * Complete type definitions for the benchmark engine
 */

/**
 * Supported programming languages for benchmarking
 */
export interface LanguageConfig {
  name: string;
  extension: string;
  command: string;
  args: string[];
}

/**
 * Map of supported languages with their execution configurations
 */
export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    extension: 'js',
    command: 'node',
    args: ['{{file}}'],
  },
  typescript: {
    name: 'TypeScript',
    extension: 'ts',
    command: 'npx',
    args: ['tsx', '{{file}}'],
  },
  python: {
    name: 'Python',
    extension: 'py',
    command: 'python3',
    args: ['{{file}}'],
  },
  go: {
    name: 'Go',
    extension: 'go',
    command: 'go',
    args: ['run', '{{file}}'],
  },
  rust: {
    name: 'Rust',
    extension: 'rs',
    command: 'rustc',
    args: ['{{file}}', '-o', '{{output}}'],
  },
};

/**
 * Request to start a benchmark
 */
export interface BenchmarkRequest {
  code: string;
  language: string;
  timeout?: number;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Raw execution result from sandbox
 */
export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: number;
  peakMemory: number;
  averageCpu: number;
  metrics: MetricSnapshot[];
}

/**
 * Snapshot of metrics at a point in time
 */
export interface MetricSnapshot {
  timestamp: number;
  cpuPercent: number;
  memoryMB: number;
}

/**
 * Carbon estimation result
 */
export interface CarbonEstimate {
  powerWatts: number;
  energyWattHours: number;
  carbonGrams: number;
  gridCarbonIntensity: number;
}

/**
 * Complete benchmark report with all metrics
 */
export interface BenchmarkReport {
  id: string;
  name: string;
  language: string;
  runtimeMs: number;
  cpuPercent: number;
  memoryMB: number;
  estimatedPowerW: number;
  estimatedEnergyWh: number;
  estimatedCarbonGrams: number;
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request to compare multiple benchmarks
 */
export interface CompareRequest {
  ids: string[];
}

/**
 * Comparison result between benchmarks
 */
export interface CompareResult {
  benchmarks: BenchmarkReport[];
  comparison: {
    fastestId: string;
    slowestId: string;
    mostEfficientId: string;
    lowestCarbonId: string;
    differences: {
      runtimeDiff: number;
      energyDiff: number;
      carbonDiff: number;
    };
  };
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Carbon estimator interface - allows replacement with ML model later
 */
export interface CarbonEstimator {
  /**
   * Estimate carbon footprint from benchmark metrics
   */
  estimate(
    runtimeMs: number,
    cpuPercent: number,
    memoryMB: number
  ): CarbonEstimate;
}

/**
 * Storage interface for benchmark persistence
 */
export interface BenchmarkStorage {
  save(report: BenchmarkReport): Promise<void>;
  getById(id: string): Promise<BenchmarkReport | null>;
  getAll(): Promise<BenchmarkReport[]>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}