export interface AnalysisRequest {
  code: string;
  language: string;
  options?: AnalysisOptions;
}

export interface AnalysisOptions {
  includePerformanceMetrics?: boolean;
  includeSecurityChecks?: boolean;
  includeBestPractices?: boolean;
}

export interface AnalysisResult {
  score: number;
  issues: Issue[];
  metrics?: PerformanceMetrics;
  suggestions: Suggestion[];
  timestamp: string;
}

export interface Issue {
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  message: string;
  rule?: string;
  code?: string;
}

export interface PerformanceMetrics {
  timeComplexity?: string;
  spaceComplexity?: string;
  estimatedExecutionTime?: number;
  memoryUsage?: number;
}

export interface Suggestion {
  type: 'optimization' | 'refactor' | 'best-practice';
  message: string;
  original?: string;
  replacement?: string;
  line?: number;
}

export interface BenchmarkRequest {
  code: string;
  language: string;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  input: unknown;
  expectedOutput?: unknown;
}

export interface BenchmarkResult {
  testCases: TestCaseResult[];
  summary: BenchmarkSummary;
}

export interface TestCaseResult {
  name: string;
  passed: boolean;
  actualOutput?: unknown;
  error?: string;
  executionTime?: number;
}

export interface BenchmarkSummary {
  totalTests: number;
  passed: number;
  failed: number;
  totalTime: number;
  averageTime: number;
}

export interface OptimizationRequest {
  code: string;
  language: string;
  goal: 'performance' | 'memory' | 'readability' | 'balanced';
}

export interface OptimizationImprovement {
  type: 'performance' | 'memory' | 'readability' | 'maintainability';
  description: string;
  impact: 'high' | 'medium' | 'low';
  beforeMetric: number;
  afterMetric: number;
}

export interface OptimizationResult {
  id: string;
  timestamp: Date;
  fileName: string;
  language: string;
  originalCode: string;
  optimizedCode: string;
  improvements: OptimizationImprovement[];
}

export interface GitHubAnalysisRequest {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}

export interface GitHubAnalysisResult {
  files: GitHubFileAnalysis[];
  summary: {
    totalFiles: number;
    totalIssues: number;
    averageScore: number;
  };
}

export interface GitHubFileAnalysis {
  path: string;
  score: number;
  issues: Issue[];
  suggestions: Suggestion[];
}

export interface SandboxRequest {
  code: string;
  language: string;
  timeout?: number;
  memoryLimit?: number;
}

export interface SandboxResult {
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
  memoryUsed?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}