/**
 * Smart Optimization Service
 * 
 * Provides intelligent code optimization with:
 * - LLM-based optimization for maximum performance
 * - C/C++ special handling (system-level optimization, no sandbox)
 * - E2B sandbox execution for other languages
 * - Error recovery with up to 3 retries
 * - Carbon footprint measurement
 */

import { logger } from '../infrastructure/logger';
import { aiOptimizeCode } from './aiOptimizationService';
import { E2BSandboxService } from './e2bSandboxService';
import { SandboxExecutionResult } from '../types/benchmark';
import { config } from '../config';

export interface SmartOptimizationResult {
  success: boolean;
  originalCode: string;
  optimizedCode: string;
  language: string;
  improvements: OptimizationImprovement[];
  carbonSavings?: CarbonSavings;
  error?: string;
  retries: number;
}

export interface OptimizationImprovement {
  type: 'performance' | 'carbon' | 'memory' | 'maintainability';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface CarbonSavings {
  originalExecutionTime: number;
  optimizedExecutionTime: number;
  timeSavingsPercent: number;
  originalMemory: number;
  optimizedMemory: number;
  memorySavingsPercent: number;
  carbonSaved: number; // grams of CO2
}

// Languages that get system-level optimization without sandbox
const SYSTEM_LANGUAGES = ['c', 'cpp', 'c++', 'rust', 'go'];

// Carbon emission factors (grams CO2 per second of CPU time)
const CARBON_PER_SECOND = 0.02; // Average data center emission

// Create sandbox service instance
const sandboxService = new E2BSandboxService({
  apiKey: config.e2bApiKey || '',
  timeout: 60000,
  maxMemory: 512,
});

/**
 * Smart optimization service with retry logic
 */
export class SmartOptimizationService {
  private readonly maxRetries = 3;

  /**
   * Optimize code with intelligent retry logic
   */
  async optimize(
    code: string,
    language: string,
    goal: 'performance' | 'carbon' = 'carbon'
  ): Promise<SmartOptimizationResult> {
    const lang = language.toLowerCase();
    const isSystemLanguage = SYSTEM_LANGUAGES.includes(lang);
    
    logger.info('Starting smart optimization', { language, isSystemLanguage, goal });

    // For C/C++/Rust/Go: Use LLM for system-level optimization, no sandbox needed
    if (isSystemLanguage) {
      return this.optimizeSystemLanguage(code, language, goal);
    }

    // For other languages: LLM + Sandbox + Retry logic
    return this.optimizeWithSandbox(code, language, goal);
  }

  /**
   * Optimize C/C++/Rust/Go code with system-level optimizations
   */
  private async optimizeSystemLanguage(
    code: string,
    language: string,
    goal: 'performance' | 'carbon'
  ): Promise<SmartOptimizationResult> {
    logger.info('Optimizing system language (no sandbox)', { language });

    try {
      // Use specialized system-level optimization prompt
      const systemPrompt = this.getSystemLanguagePrompt(language);
      
      // Use 'performance' as the goal since aiOptimizeCode doesn't support 'carbon'
      const result = await aiOptimizeCode(code, language, 'performance', systemPrompt);

      return {
        success: true,
        originalCode: code,
        optimizedCode: result.optimizedCode,
        language,
        improvements: result.optimizationSummary.map(s => ({
          type: 'performance' as const,
          description: s.description || s.type,
          impact: 'high' as const,
        })),
        retries: 0,
      };
    } catch (error) {
      logger.error('System language optimization failed', { error });
      return {
        success: false,
        originalCode: code,
        optimizedCode: code,
        language,
        improvements: [],
        error: error instanceof Error ? error.message : 'Optimization failed',
        retries: 0,
      };
    }
  }

  /**
   * Optimize with sandbox and retry logic
   */
  private async optimizeWithSandbox(
    code: string,
    language: string,
    goal: 'performance' | 'carbon'
  ): Promise<SmartOptimizationResult> {
    let currentCode = code;
    let lastError: string | undefined;
    const improvements: OptimizationImprovement[] = [];

    // First, benchmark original code
    const originalBenchmark = await this.benchmarkCode(code, language);
    if (!originalBenchmark.success || !originalBenchmark.result) {
      // If sandbox fails due to unsupported language, try LLM-only optimization
      if (originalBenchmark.error?.includes('Unsupported language')) {
        logger.info('Sandbox not available for language, using LLM-only optimization', { language });
        return this.optimizeWithLLMOnly(code, language, goal);
      }
      return {
        success: false,
        originalCode: code,
        optimizedCode: code,
        language,
        improvements: [],
        error: `Original code failed to execute: ${originalBenchmark.error || 'Unknown error'}`,
        retries: 0,
      };
    }

    const originalResult = originalBenchmark.result;

    // Retry loop: LLM -> Sandbox -> Error? -> Retry (max 3)
    for (let retry = 0; retry < this.maxRetries; retry++) {
      logger.info(`Optimization attempt ${retry + 1}/${this.maxRetries}`);

      try {
        // Get LLM optimization with context about previous errors
        const context = retry > 0 && lastError
          ? `\n\nPrevious attempt had an error: ${lastError}\nPlease fix this.`
          : '';

        // Use 'performance' as the goal since aiOptimizeCode doesn't support 'carbon'
        const result = await aiOptimizeCode(
          currentCode,
          language,
          'performance',
          context
        );

        // Test optimized code in sandbox
        const benchmarkResult = await this.benchmarkCode(result.optimizedCode, language);

        if (benchmarkResult.success && benchmarkResult.result) {
          // Success! Calculate carbon savings
          const carbonSavings = this.calculateCarbonSavings(
            originalResult,
            benchmarkResult.result
          );

          // Collect improvements
          improvements.push(...result.optimizationSummary.map(s => ({
            type: 'carbon' as const,
            description: s.description || s.type,
            impact: 'high' as const,
          })));

          return {
            success: true,
            originalCode: code,
            optimizedCode: result.optimizedCode,
            language,
            improvements,
            carbonSavings,
            retries: retry,
          };
        } else {
          // Sandbox failed - will retry with error context
          lastError = benchmarkResult.error;
          currentCode = result.optimizedCode;
          logger.warn(`Sandbox failed, retrying`, { error: lastError, retry });
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`LLM optimization failed on retry ${retry}`, { error: lastError });
      }
    }

    // All retries exhausted
    return {
      success: false,
      originalCode: code,
      optimizedCode: currentCode,
      language,
      improvements,
      error: `Failed after ${this.maxRetries} attempts: ${lastError || 'Unknown error'}`,
      retries: this.maxRetries,
    };
  }

  /**
   * Benchmark code in sandbox
   */
  private async benchmarkCode(
    code: string,
    language: string
  ): Promise<{ success: boolean; result?: SandboxExecutionResult; error?: string }> {
    try {
      const result = await sandboxService.executeInSandbox(code, language, 60000);
      
      if (result.exitCode !== 0) {
        return {
          success: false,
          error: result.stderr || 'Execution failed',
        };
      }

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sandbox execution failed',
      };
    }
  }

  /**
   * Calculate carbon savings between original and optimized
   */
  private calculateCarbonSavings(
    original: SandboxExecutionResult,
    optimized: SandboxExecutionResult
  ): CarbonSavings {
    const timeSavings = original.runtime - optimized.runtime;
    const timeSavingsPercent = (timeSavings / original.runtime) * 100;

    const memorySavings = original.peakMemory - optimized.peakMemory;
    const memorySavingsPercent = original.peakMemory > 0 
      ? (memorySavings / original.peakMemory) * 100 
      : 0;

    // Carbon calculation based on execution time savings
    const carbonSaved = (timeSavings / 1000) * CARBON_PER_SECOND;

    return {
      originalExecutionTime: original.runtime,
      optimizedExecutionTime: optimized.runtime,
      timeSavingsPercent: Math.max(0, timeSavingsPercent),
      originalMemory: original.peakMemory,
      optimizedMemory: optimized.peakMemory,
      memorySavingsPercent: Math.max(0, memorySavingsPercent),
      carbonSaved: Math.max(0, carbonSaved),
    };
  }

  /**
   * Optimize using LLM only (no sandbox) - for unsupported languages
   */
  private async optimizeWithLLMOnly(
    code: string,
    language: string,
    goal: 'performance' | 'carbon'
  ): Promise<SmartOptimizationResult> {
    logger.info('Using LLM-only optimization', { language });

    try {
      // Use general optimization prompt
      const generalPrompt = `You are an expert ${language} programmer. 
Optimize this code for better performance and efficiency.
Focus on:
- Algorithm improvements
- Reducing unnecessary operations
- Better data structures
- Memory efficiency
- Return ONLY the optimized code, no explanations.`;

      const result = await aiOptimizeCode(code, language, 'performance', generalPrompt);

      return {
        success: true,
        originalCode: code,
        optimizedCode: result.optimizedCode,
        language,
        improvements: result.optimizationSummary.map(s => ({
          type: 'performance' as const,
          description: s.description || s.type,
          impact: 'high' as const,
        })),
        retries: 0,
      };
    } catch (error) {
      logger.error('LLM-only optimization failed', { error });
      return {
        success: false,
        originalCode: code,
        optimizedCode: code,
        language,
        improvements: [],
        error: error instanceof Error ? error.message : 'Optimization failed',
        retries: 0,
      };
    }
  }

  /**
   * Get specialized prompt for system languages
   */
  private getSystemLanguagePrompt(language: string): string {
    const prompts: Record<string, string> = {
      c: `You are an expert C programmer. Optimize for:
- Maximum performance (CPU cycles, cache efficiency)
- Memory layout optimization
- Compiler optimizations (-O3, vectorization)
- System-level best practices
- Return ONLY the optimized code, no explanations.`,

      cpp: `You are an expert C++ programmer. Optimize for:
- Maximum performance (CPU cycles, cache efficiency)
- Modern C++ idioms (move semantics, constexpr)
- Memory layout optimization
- Compiler optimizations (-O3, -march=native)
- STL algorithm optimization
- Return ONLY the optimized code, no explanations.`,

      rust: `You are an expert Rust programmer. Optimize for:
- Maximum performance (LLVM optimizations)
- Zero-cost abstractions
- SIMD/vectorization where applicable
- Memory efficiency
- Release mode optimizations
- Return ONLY the optimized code, no explanations.`,

      go: `You are an expert Go programmer. Optimize for:
- Maximum performance
- Goroutine efficiency
- Memory allocation reduction
- Escape analysis optimization
- Inlining and compiler hints
- Return ONLY the optimized code, no explanations.`,
    };

    return prompts[language.toLowerCase()] || prompts.cpp || '';
  }
}

export const smartOptimizationService = new SmartOptimizationService();