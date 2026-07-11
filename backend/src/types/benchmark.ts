/**
 * Benchmark Types
 * 
 * Type definitions for the benchmark engine.
 */

export interface BenchmarkRequest {
  /** Name of the benchmark (optional, auto-generated if not provided) */
  name?: string;
  /** Programming language of the code */
  language: string;
  /** Source code to execute */
  code: string;
  /** Execution timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface BenchmarkReport {
  /** Unique identifier */
  id: string;
  /** Benchmark name */
  name: string;
  /** Programming language */
  language: string;
  /** Execution time in milliseconds */
  runtimeMs: number;
  /** Average CPU usage percentage */
  cpuPercent: number;
  /** Peak memory usage in MB */
  memoryMB: number;
  /** Estimated power consumption in Watts */
  estimatedPowerW: number;
  /** Estimated energy consumption in Watt-hours */
  estimatedEnergyWh: number;
  /** Estimated carbon emissions in grams */
  estimatedCarbonGrams: number;
  /** Standard output from execution */
  stdout: string;
  /** Standard error from execution */
  stderr: string;
  /** Process exit code */
  exitCode: number;
  /** Timestamp of execution */
  timestamp: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface SandboxExecutionResult {
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Process exit code */
  exitCode: number;
  /** Execution time in milliseconds */
  runtime: number;
  /** Peak memory in MB */
  peakMemory: number;
  /** Average CPU percentage */
  averageCpu: number;
  /** Metric snapshots */
  metrics: MetricSnapshot[];
}

export interface MetricSnapshot {
  /** Timestamp of the snapshot */
  timestamp: number;
  /** CPU usage percentage */
  cpuPercent: number;
  /** Memory usage in MB */
  memoryMB: number;
}

export interface CarbonEstimate {
  /** Power consumption in Watts */
  powerWatts: number;
  /** Energy consumption in Watt-hours */
  energyWattHours: number;
  /** Carbon emissions in grams */
  carbonGrams: number;
}

export interface BenchmarkComparison {
  /** First benchmark ID */
  benchmarkA: string;
  /** Second benchmark ID */
  benchmarkB: string;
  /** Runtime difference in ms */
  runtimeDiffMs: number;
  /** Runtime difference percentage */
  runtimeDiffPercent: number;
  /** Memory difference in MB */
  memoryDiffMB: number;
  /** Carbon difference in grams */
  carbonDiffGrams: number;
  /** Winner ('a', 'b', or 'tie') */
  winner: 'a' | 'b' | 'tie';
}

export interface BenchmarkHistory {
  /** List of benchmark reports */
  benchmarks: BenchmarkReport[];
  /** Total count */
  total: number;
  /** Pagination info */
  page: number;
  /** Page size */
  pageSize: number;
}

export interface LanguageConfig {
  /** Language name */
  name: string;
  /** File extension */
  extension: string;
  /** Command to run */
  command: string;
  /** Command arguments */
  args: string[];
}

export const SUPPORTED_LANGUAGES: Record<string, Omit<LanguageConfig, 'name'>> = {
  python: {
    extension: 'py',
    command: 'python3',
    args: ['{{file}}'],
  },
  javascript: {
    extension: 'js',
    command: 'node',
    args: ['{{file}}'],
  },
  typescript: {
    extension: 'ts',
    command: 'npx',
    args: ['ts-node', '{{file}}'],
  },
  go: {
    extension: 'go',
    command: 'go',
    args: ['run', '{{file}}'],
  },
  rust: {
    extension: 'rs',
    command: 'rustc',
    args: ['{{file}}', '-o', '{{output}}'],
  },
  java: {
    extension: 'java',
    command: 'java',
    args: ['{{file}}'],
  },
  c: {
    extension: 'c',
    command: 'gcc',
    args: ['{{file}}', '-o', '{{output}}'],
  },
  cpp: {
    extension: 'cpp',
    command: 'g++',
    args: ['{{file}}', '-o', '{{output}}'],
  },
};