/**
 * Orchestrator Types
 * 
 * Defines types for the Multi-Agent Orchestrator workflow.
 */

import type { ValidationResult } from './validation.js';
import type { AnalysisResult, BenchmarkResult } from './index.js';

/**
 * Configuration for the orchestrator
 */
export interface OrchestratorConfig {
  /** Maximum number of retry attempts for optimization */
  maxRetries: number;
  /** Enable benchmark comparison */
  enableBenchmark: boolean;
  /** Auto-accept if improvement exceeds threshold */
  autoAcceptThreshold?: number;
  /** Show diff viewer after optimization */
  showDiffViewer: boolean;
}

/**
 * Current state of the orchestrator workflow
 */
export interface WorkflowState {
  /** Current step in the workflow */
  currentStep: WorkflowStep;
  /** Number of optimization retries attempted */
  retryCount: number;
  /** Whether the workflow has been cancelled */
  cancelled: boolean;
  /** Original code being processed */
  originalCode: string;
  /** Optimized code (if generated) */
  optimizedCode?: string;
  /** Analysis results from Analysis Agent */
  analysisResult?: AnalysisResult;
  /** Original benchmark results */
  originalBenchmark?: BenchmarkResult;
  /** Optimized benchmark results */
  optimizedBenchmark?: BenchmarkResult;
  /** Validation results */
  validationResult?: ValidationResult;
  /** Errors collected during workflow */
  errors: WorkflowError[];
  /** Start time of the workflow */
  startTime: number;
}

/**
 * Steps in the orchestrator workflow
 */
export type WorkflowStep =
  | 'idle'
  | 'analyzing'
  | 'benchmarking_original'
  | 'optimizing'
  | 'validating'
  | 'benchmarking_optimized'
  | 'comparing'
  | 'awaiting_approval'
  | 'generating_pr'
  | 'completed'
  | 'failed';

/**
 * Error that occurred during workflow
 */
export interface WorkflowError {
  /** Step where the error occurred */
  step: WorkflowStep;
  /** Error message */
  message: string;
  /** Error details */
  details?: string;
  /** Timestamp of the error */
  timestamp: number;
}

/**
 * Result of the orchestrator workflow
 */
export interface WorkflowResult {
  /** Whether the workflow completed successfully */
  success: boolean;
  /** Original code */
  originalCode: string;
  /** Optimized code (if successful) */
  optimizedCode?: string;
  /** Benchmark comparison (if available) */
  benchmarkComparison?: BenchmarkComparison;
  /** Validation report (if validation ran) */
  validationReport?: ValidationReport;
  /** Total workflow duration in ms */
  totalDuration: number;
  /** Number of retries attempted */
  retryCount: number;
  /** Errors encountered (if failed) */
  errors: WorkflowError[];
}

/**
 * Comparison of original vs optimized benchmarks
 */
export interface BenchmarkComparison {
  original: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: {
    runtimePercent: number;
    memoryPercent: number;
    carbonPercent: number;
  };
}

/**
 * Validation report for failed optimizations
 */
export interface ValidationReport {
  validationResult: ValidationResult;
  errorAnalysis?: ErrorAnalysis;
  recommendations: string[];
}

/**
 * Analysis of validation errors
 */
export interface ErrorAnalysis {
  /** Summary of the errors */
  summary: string;
  /** Detailed error descriptions */
  errors: ErrorDescription[];
  /** Root causes identified */
  rootCauses: string[];
  /** Suggested fixes */
  suggestedFixes: string[];
}

/**
 * Description of a single error
 */
export interface ErrorDescription {
  /** Error type (compilation, linting, test, etc.) */
  type: string;
  /** Error message */
  message: string;
  /** File where error occurred */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Explanation of the error */
  explanation: string;
}

/**
 * Default orchestrator configuration
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxRetries: 3,
  enableBenchmark: true,
  showDiffViewer: true,
};