export interface OptimizationItem {
  type: string;
  before: string;
  after: string;
  impact: 'high' | 'medium' | 'low';
}

export interface OptimizationRequest {
  code: string;
  language: string;
  goal?: 'performance' | 'memory' | 'readability' | 'balanced';
  context?: string;
  astAnalysis?: any;
  benchmarkReport?: any;
}

export interface OptimizationResponse {
  optimizedCode: string;
  explanation: string;
  optimizationSummary: OptimizationItem[];
  confidenceScore: number;
  retryHints: string[];
}