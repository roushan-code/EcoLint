/**
 * Types for the static analysis engine
 */

export interface Finding {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  code?: string;
  suggestion?: string;
}

export interface AnalysisResult {
  file: string;
  findings: Finding[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface AnalysisEngineConfig {
  maxLoopNesting?: number;
  maxFunctionLines?: number;
  maxSwitchCases?: number;
  maxNestingDepth?: number;
  duplicateCodeThreshold?: number;
}

export interface Rule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  detect(context: RuleContext): Finding[];
}

export interface RuleContext {
  sourceFile: any;
  project: any;
  config: AnalysisEngineConfig;
}