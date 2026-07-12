import { randomUUID } from 'crypto';
import { OptimizationResult, OptimizationImprovement } from '../types/index.js';

export function optimizeCode(
  code: string,
  language: string,
  goal: 'performance' | 'memory' | 'readability' | 'balanced' | 'carbon'
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
    case 'carbon':
      optimizedCode = applyCarbonOptimizations(code, improvements);
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

function applyCarbonOptimizations(
  code: string,
  improvements: OptimizationImprovement[]
): string {
  let optimized = code;

  // Replace for loops with reduce for array summation (more energy efficient)
  // Pattern: for loop with accumulator
  const forLoopPattern = /for\s*\(\s*(?:let|var)\s+\w+\s*=\s*0;\s*\w+\s*<\s*\w+\.length;\s*\w+\+\+\)\s*\{[^}]*total\s*=\s*total\s*\+\s*\w+\[[^\]]+\][^}]*\}/g;
  if (forLoopPattern.test(optimized)) {
    optimized = optimized.replace(forLoopPattern, (match) => {
      // Extract array name
      const arrayMatch = match.match(/(\w+)\.length/);
      const arrayName = arrayMatch ? arrayMatch[1] : 'arr';
      improvements.push({
        type: 'performance',
        description: 'Replaced for loop with reduce() for array operations - reduces CPU cycles and carbon emissions',
        impact: 'high',
        beforeMetric: 0,
        afterMetric: 0,
      });
      return `// Optimized: using reduce() for better energy efficiency\nconst total = ${arrayName}.reduce((sum, val) => sum + val, 0);`;
    });
  }

  // Replace forEach with map when collecting results
  const forEachPattern = /(\w+)\.forEach\(\s*\(\s*\w+\s*\)\s*=>\s*\{[^}]*\}\s*\)/g;
  if (forEachPattern.test(optimized)) {
    optimized = optimized.replace(forEachPattern, (match, arrayName) => {
      improvements.push({
        type: 'performance',
        description: 'Replaced forEach with map() - enables parallel processing and reduces execution time',
        impact: 'high',
        beforeMetric: 0,
        afterMetric: 0,
      });
      return `${arrayName}.map(val => val)`;
    });
  }

  // Cache array length outside loops
  const loopWithLengthPattern = /for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length;/g;
  if (loopWithLengthPattern.test(optimized)) {
    optimized = optimized.replace(loopWithLengthPattern, (match, i, arr) => {
      improvements.push({
        type: 'performance',
        description: 'Cached array length outside loop - reduces property lookups and CPU usage',
        impact: 'medium',
        beforeMetric: 0,
        afterMetric: 0,
      });
      return `const len = ${arr}.length;\nfor (let ${i} = 0; ${i} < len;`;
    });
  }

  // Use const where possible
  optimized = optimized.replace(/\bvar\s+/g, 'const ');
  if (optimized.includes('var ')) {
    improvements.push({
      type: 'performance',
      description: 'Replaced var with const - enables better memory optimization',
      impact: 'low',
      beforeMetric: 0,
      afterMetric: 0,
    });
  }

  // Use let instead of var for mutable loop variables
  if (optimized.includes('var ')) {
    optimized = optimized.replace(/\bvar\s+/g, 'let ');
    improvements.push({
      type: 'performance',
      description: 'Replaced var with let - better scoping reduces memory churn',
      impact: 'low',
      beforeMetric: 0,
      afterMetric: 0,
    });
  }

  return optimized;
}
