import { randomUUID } from 'crypto';
import { OptimizationResult, OptimizationImprovement } from '../types/index.js';

export function optimizeCode(
  code: string,
  language: string,
  goal: 'performance' | 'memory' | 'readability' | 'balanced'
): OptimizationResult {
  const improvements: OptimizationImprovement[] = [];
  
  let optimizedCode = code;

  // Apply optimizations based on goal
  switch (goal) {
    case 'performance':
      optimizedCode = applyPerformanceOptimizations(code, improvements);
      break;
    case 'memory':
      optimizedCode = applyMemoryOptimizations(code, improvements);
      break;
    case 'readability':
      optimizedCode = applyReadabilityOptimizations(code, improvements);
      break;
    case 'balanced':
      optimizedCode = applyBalancedOptimizations(code, improvements);
      break;
  }

  return {
    id: randomUUID(),
    timestamp: new Date(),
    fileName: '',
    language,
    originalCode: code,
    optimizedCode,
    improvements,
  };
}

function applyPerformanceOptimizations(
  code: string,
  improvements: OptimizationImprovement[]
): string {
  let optimized = code;
  const originalLength = optimized.length;

  // Replace var with const/let
  if (optimized.includes('var ')) {
    optimized = optimized.replace(/\bvar\s+/g, 'const ');
    improvements.push({
      type: 'performance',
      description: 'Replaced var with const for better performance',
      impact: 'medium',
      beforeMetric: 0,
      afterMetric: 0,
    });
  }

  // Use map instead of forEach when collecting results
  if (optimized.includes('.forEach(') && !optimized.includes('.map(')) {
    improvements.push({
      type: 'performance',
      description: 'Consider using map() for better performance when collecting results',
      impact: 'high',
      beforeMetric: 0,
      afterMetric: 0,
    });
  }

  // Cache array length in loops
  if (optimized.includes('for (let i = 0; i <')) {
    improvements.push({
      type: 'performance',
      description: 'Consider caching array length in loops for better performance',
      impact: 'medium',
      beforeMetric: 0,
      afterMetric: 0,
    });
  }

  return optimized;
}

function applyMemoryOptimizations(
  code: string,
  improvements: OptimizationImprovement[]
): string {
  let optimized = code;

  // Use const where possible
  optimized = optimized.replace(/\blet\s+/g, 'const ');
  improvements.push({
    type: 'memory',
    description: 'Use const to allow better memory optimization by JavaScript engine',
    impact: 'low',
    beforeMetric: 0,
    afterMetric: 0,
  });

  // Remove unused variables
  const unusedVars = optimized.match(/\b(const|let)\s+\w+\s*=\s*[^;]+;/g) || [];
  if (unusedVars.length > 0) {
    improvements.push({
      type: 'memory',
      description: `Found ${unusedVars.length} potentially unused variables`,
      impact: 'low',
      beforeMetric: unusedVars.length,
      afterMetric: 0,
    });
  }

  return optimized;
}

function applyReadabilityOptimizations(
  code: string,
  improvements: OptimizationImprovement[]
): string {
  let optimized = code;

  // Add proper spacing
  optimized = optimized.replace(/\{/g, ' {\n  ');
  optimized = optimized.replace(/\}/g, '\n}\n');
  improvements.push({
    type: 'readability',
    description: 'Added proper formatting for better readability',
    impact: 'medium',
    beforeMetric: 0,
    afterMetric: 0,
  });

  // Use meaningful variable names (simplified example)
  improvements.push({
    type: 'readability',
    description: 'Consider using descriptive variable names',
    impact: 'low',
    beforeMetric: 0,
    afterMetric: 0,
  });

  return optimized;
}

function applyBalancedOptimizations(
  code: string,
  improvements: OptimizationImprovement[]
): string {
  let optimized = code;

  // Apply const/let
  optimized = optimized.replace(/\bvar\s+/g, 'const ');
  improvements.push({
    type: 'maintainability',
    description: 'Replaced var with const',
    impact: 'medium',
    beforeMetric: 0,
    afterMetric: 0,
  });

  // Basic formatting
  improvements.push({
    type: 'maintainability',
    description: 'Applied balanced optimization approach',
    impact: 'low',
    beforeMetric: 0,
    afterMetric: 0,
  });

  return optimized;
}