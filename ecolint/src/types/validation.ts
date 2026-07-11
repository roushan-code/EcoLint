/**
 * Validation Types
 * 
 * Types for the Validation Agent that validates optimized code.
 */

import type { BenchmarkResult } from './index.js';

export interface ValidationError {
  type: 'compilation' | 'linting' | 'runtime' | 'test';
  file?: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  duration: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface BenchmarkComparison {
  original: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: {
    runtimePercent: number;
    memoryPercent: number;
    carbonPercent: number;
  };
}

export interface ValidationResult {
  success: boolean;
  checks: ValidationCheck[];
  benchmarkComparison?: BenchmarkComparison;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalDuration: number;
  };
}

export interface ValidationRequest {
  originalCode: string;
  optimizedCode: string;
  fileName: string;
  language: string;
  runBenchmarks?: boolean;
}