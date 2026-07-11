export interface AnalysisResult {
  id: string;
  timestamp: Date;
  fileName: string;
  language: string;
  issues: Issue[];
  suggestions: Suggestion[];
  metrics: CodeMetrics;
}

export interface Issue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  message: string;
  rule?: string;
  code?: string;
}

export interface Suggestion {
  id: string;
  type: 'optimization' | 'refactor' | 'best-practice';
  message: string;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface BenchmarkResult {
  id: string;
  timestamp: Date;
  fileName: string;
  language: string;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  comparisons: BenchmarkComparison[];
}

export interface BenchmarkComparison {
  name: string;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
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

export interface OptimizationImprovement {
  type: 'performance' | 'memory' | 'readability' | 'maintainability';
  description: string;
  impact: 'high' | 'medium' | 'low';
  beforeMetric: number;
  afterMetric: number;
}

export interface PullRequestPayload {
  title: string;
  description: string;
  analysisResults: AnalysisResult[];
  benchmarkResults: BenchmarkResult[];
  optimizationResults: OptimizationResult[];
  targetBranch: string;
  sourceBranch: string;
}

export interface PullRequestResponse {
  prUrl: string;
  prNumber: number;
  status: string;
}