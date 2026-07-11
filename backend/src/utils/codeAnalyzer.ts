import { AnalysisResult, Issue, Suggestion, PerformanceMetrics } from '../types/index.js';

export function analyzeCode(code: string, language: string): AnalysisResult {
  const issues: Issue[] = [];
  const suggestions: Suggestion[] = [];
  const metrics: PerformanceMetrics = {};

  // Basic code analysis
  const lines = code.split('\n');
  
  // Check for common issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for console.log statements
    if (line.includes('console.log') || line.includes('console.error')) {
      issues.push({
        severity: 'warning',
        line: lineNum,
        column: line.indexOf('console.'),
        message: 'Avoid using console statements in production code',
        rule: 'no-console',
      });
    }

    // Check for TODO comments
    if (line.includes('TODO') || line.includes('FIXME')) {
      issues.push({
        severity: 'info',
        line: lineNum,
        column: line.indexOf('TODO') !== -1 ? line.indexOf('TODO') : line.indexOf('FIXME'),
        message: 'Found unresolved TODO/FIXME comment',
        rule: 'no-warning-comments',
      });
    }

    // Check for long lines
    if (line.length > 120) {
      issues.push({
        severity: 'info',
        line: lineNum,
        column: 120,
        message: 'Line exceeds 120 characters',
        rule: 'max-len',
      });
    }
    
    // Check for for loops (potential optimization opportunity)
    if (line.includes('for') && line.includes('let')) {
      issues.push({
        severity: 'info',
        line: lineNum,
        column: line.indexOf('for'),
        message: 'Consider using array methods (reduce, forEach, map) instead of for loops for better readability',
        rule: 'prefer-array-methods',
      });
    }
    
    // Check for nested for loops
    if (line.includes('for') && code.includes('for') && code.indexOf('for', code.indexOf('for') + 1) !== -1) {
      const nestedForIndex = code.indexOf('for', code.indexOf('for') + 1);
      const lineOfNested = code.substring(0, nestedForIndex).split('\n').length;
      if (lineOfNested === lineNum) {
        issues.push({
          severity: 'warning',
          line: lineNum,
          column: line.indexOf('for'),
          message: 'Nested for loops detected - consider optimizing for better performance',
          rule: 'no-nested-loops',
        });
      }
    }
  });
  
  // Check for recursive functions
  const functionMatches = code.match(/function\s+(\w+)/g) || [];
  for (const match of functionMatches) {
    const funcName = match.replace('function ', '');
    const regex = new RegExp(`${funcName}\\s*\\(`);
    if (regex.test(code)) {
      issues.push({
        severity: 'warning',
        line: 1,
        column: code.indexOf(match),
        message: `Potential recursive function '${funcName}' detected - ensure proper termination condition`,
        rule: 'no-recursive-functions',
      });
    }
  }

  // Calculate basic metrics
  metrics.timeComplexity = estimateTimeComplexity(code);
  metrics.spaceComplexity = estimateSpaceComplexity(code);
  metrics.estimatedExecutionTime = estimateExecutionTime(code);
  metrics.memoryUsage = estimateMemoryUsage(code);

  // Generate suggestions
  if (issues.length > 5) {
    suggestions.push({
      type: 'best-practice',
      message: 'Consider breaking down this code into smaller, more manageable functions',
    });
  }

  if (metrics.timeComplexity === 'O(n²)' || metrics.timeComplexity === 'O(2^n)') {
    suggestions.push({
      type: 'optimization',
      message: 'Consider optimizing the algorithm to reduce time complexity',
    });
  }

  // Calculate score
  const score = calculateScore(issues);

  return {
    score,
    issues,
    metrics,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

function estimateTimeComplexity(code: string): string {
  const nestedLoops = (code.match(/for\s*\([^)]*\)[^}]*for\s*\(/g) || []).length;
  // Check for recursive function calls (function name followed by same name call)
  const functionNames = code.match(/function\s+(\w+)/g) || [];
  let recursiveCalls = 0;
  for (const match of functionNames) {
    const funcName = match.replace('function ', '');
    if (code.includes(`${funcName}()`)) {
      recursiveCalls++;
    }
  }
  
  if (nestedLoops >= 2 || recursiveCalls > 0) {
    return 'O(n²) or worse';
  }
  if (code.includes('for') || code.includes('while')) {
    return 'O(n)';
  }
  return 'O(1)';
}

function estimateSpaceComplexity(code: string): string {
  const arrayCreations = (code.match(/\[\s*\]|\[\s*\d+\s*\]/g) || []).length;
  const objectCreations = (code.match(/\{[^}]*\}/g) || []).length;
  
  if (arrayCreations > 2 || objectCreations > 3) {
    return 'O(n)';
  }
  return 'O(1)';
}

function estimateExecutionTime(code: string): number {
  const lines = code.split('\n').length;
  return Math.max(1, lines * 0.1);
}

function estimateMemoryUsage(code: string): number {
  const variables = (code.match(/\b(const|let|var)\s+\w+/g) || []).length;
  return Math.min(100, variables * 5);
}

function calculateScore(issues: Issue[]): number {
  const errorWeight = 20;
  const warningWeight = 5;
  const infoWeight = 1;
  
  const deductions = issues.reduce((sum, issue) => {
    switch (issue.severity) {
      case 'error':
        return sum + errorWeight;
      case 'warning':
        return sum + warningWeight;
      case 'info':
        return sum + infoWeight;
    }
  }, 0);
  
  return Math.max(0, 100 - deductions);
}