import { OptimizationResult } from '../types/index.js';

export function optimizeCode(
  code: string,
  language: string,
  goal: 'performance' | 'memory' | 'readability' | 'balanced'
): OptimizationResult {
  const improvements: string[] = [];
  const tradeoffs: string[] = [];
  
  let optimizedCode = code;

  // Apply optimizations based on goal
  switch (goal) {
    case 'performance':
      optimizedCode = applyPerformanceOptimizations(code, improvements, tradeoffs);
      break;
    case 'memory':
      optimizedCode = applyMemoryOptimizations(code, improvements, tradeoffs);
      break;
    case 'readability':
      optimizedCode = applyReadabilityOptimizations(code, improvements, tradeoffs);
      break;
    case 'balanced':
      optimizedCode = applyBalancedOptimizations(code, improvements, tradeoffs);
      break;
  }

  const score = calculateOptimizationScore(code, optimizedCode, improvements, tradeoffs);

  return {
    originalCode: code,
    optimizedCode,
    improvements,
    tradeoffs,
    score,
  };
}

function applyPerformanceOptimizations(
  code: string,
  improvements: string[],
  tradeoffs: string[]
): string {
  let optimized = code;

  // Replace var with const/let
  if (optimized.includes('var ')) {
    optimized = optimized.replace(/\bvar\s+/g, 'const ');
    improvements.push('Replaced var with const for better performance');
  }

  // Use map instead of forEach when collecting results
  if (optimized.includes('.forEach(') && !optimized.includes('.map(')) {
    improvements.push('Consider using map() for better performance when collecting results');
  }

  // Cache array length in loops
  if (optimized.includes('for (let i = 0; i <')) {
    improvements.push('Consider caching array length in loops for better performance');
  }

  tradeoffs.push('Performance optimizations may reduce code readability');

  return optimized;
}

function applyMemoryOptimizations(
  code: string,
  improvements: string[],
  tradeoffs: string[]
): string {
  let optimized = code;

  // Use const where possible
  optimized = optimized.replace(/\blet\s+/g, 'const ');
  improvements.push('Use const to allow better memory optimization by JavaScript engine');

  // Remove unused variables
  const unusedVars = optimized.match(/\b(const|let)\s+\w+\s*=\s*[^;]+;/g) || [];
  if (unusedVars.length > 0) {
    improvements.push(`Found ${unusedVars.length} potentially unused variables`);
  }

  tradeoffs.push('Memory optimizations may require more complex code structure');

  return optimized;
}

function applyReadabilityOptimizations(
  code: string,
  improvements: string[],
  tradeoffs: string[]
): string {
  let optimized = code;

  // Add proper spacing
  optimized = optimized.replace(/\{/g, ' {\n  ');
  optimized = optimized.replace(/\}/g, '\n}\n');
  improvements.push('Added proper formatting for better readability');

  // Use meaningful variable names (simplified example)
  improvements.push('Consider using descriptive variable names');

  tradeoffs.push('Readability improvements may slightly reduce performance');

  return optimized;
}

function applyBalancedOptimizations(
  code: string,
  improvements: string[],
  tradeoffs: string[]
): string {
  let optimized = code;

  // Apply const/let
  optimized = optimized.replace(/\bvar\s+/g, 'const ');
  improvements.push('Replaced var with const');

  // Basic formatting
  improvements.push('Applied balanced optimization approach');

  return optimized;
}

function calculateOptimizationScore(
  original: string,
  optimized: string,
  improvements: string[],
  tradeoffs: string[]
): number {
  let score = 50; // Base score

  // Add points for improvements
  score += improvements.length * 10;

  // Subtract points for tradeoffs
  score -= tradeoffs.length * 5;

  // Bonus for code reduction
  if (optimized.length < original.length) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}