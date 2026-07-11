/**
 * Static Analysis Engine
 * Analyzes code files using configurable rules
 */

import * as ts from 'typescript';
import { Rule, RuleContext, Finding, AnalysisResult, AnalysisEngineConfig } from './types';
import {
  NestedLoopsRule,
  DuplicatedCodeRule,
  DeadCodeRule,
  UnusedVariablesRule,
  LongFunctionsRule,
  DeepNestingRule,
  ExpensiveArrayOperationsRule,
  ExpensiveStringConcatRule,
  RecursiveCallsRule,
  LargeSwitchRule,
} from './rules';

export class AnalysisEngine {
  private rules: Rule[];
  private config: AnalysisEngineConfig;

  constructor(config: AnalysisEngineConfig = {}) {
    this.config = config;
    this.rules = this.initializeRules();
  }

  private initializeRules(): Rule[] {
    return [
      new NestedLoopsRule(),
      new DuplicatedCodeRule(),
      new DeadCodeRule(),
      new UnusedVariablesRule(),
      new LongFunctionsRule(),
      new DeepNestingRule(),
      new ExpensiveArrayOperationsRule(),
      new ExpensiveStringConcatRule(),
      new RecursiveCallsRule(),
      new LargeSwitchRule(),
    ];
  }

  analyzeFile(filePath: string, sourceCode: string): AnalysisResult {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    const context: RuleContext = {
      sourceFile,
      project: null,
      config: this.config,
    };

    const allFindings: Finding[] = [];

    for (const rule of this.rules) {
      try {
        const findings = rule.detect(context);
        allFindings.push(...findings);
      } catch (error) {
        console.error(`Error running rule ${rule.name}:`, error);
      }
    }

    return this.createAnalysisResult(filePath, allFindings);
  }

  analyzeFiles(files: Map<string, string>): AnalysisResult[] {
    const results: AnalysisResult[] = [];

    for (const [filePath, sourceCode] of files) {
      results.push(this.analyzeFile(filePath, sourceCode));
    }

    return results;
  }

  private createAnalysisResult(file: string, findings: Finding[]): AnalysisResult {
    return {
      file,
      findings,
      summary: {
        errors: findings.filter((f) => f.severity === 'error').length,
        warnings: findings.filter((f) => f.severity === 'warning').length,
        info: findings.filter((f) => f.severity === 'info').length,
      },
    };
  }

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  removeRule(ruleName: string): void {
    this.rules = this.rules.filter((r) => r.name !== ruleName);
  }

  getRules(): Rule[] {
    return [...this.rules];
  }

  updateConfig(config: Partial<AnalysisEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }
}