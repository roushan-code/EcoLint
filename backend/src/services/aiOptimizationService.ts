import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../infrastructure/logger';
import type { OptimizationRequest, OptimizationResponse, OptimizationItem } from '../types/optimization';

const OPTIMIZATION_PROMPT = `You are an expert code optimization assistant. Your task is to analyze code and provide optimized versions that improve performance, reduce carbon footprint, and maintain readability.

Analyze the provided code and return a JSON response with:
1. "optimizedCode": The improved code
2. "explanation": A brief explanation of the changes
3. "optimizationSummary": Array of specific optimizations made (type, before, after, impact)
4. "confidenceScore": A number 0-1 indicating confidence in the optimization
5. "retryHints": Suggestions for further improvements if needed

Focus on:
- Reducing algorithmic complexity (O(n²) → O(n), etc.)
- Minimizing memory allocations
- Using efficient data structures
- Reducing redundant operations
- Caching repeated calculations
- Using lazy evaluation where appropriate

Return ONLY valid JSON, no markdown formatting or additional text.`;

// Retry configuration - uses values from config
const MAX_RETRIES = config.aiMaxRetries;
const BASE_RETRY_DELAY_MS = config.aiRetryDelayMs;
const RETRYABLE_STATUS_CODES = [429, 503, 504];

export class AIOptimizationService {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = config.openaiApiKey;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      
      this.client = new OpenAI({
        apiKey,
        baseURL: config.openaiEndpoint,
      });
    }
    return this.client;
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private getRetryDelay(attempt: number): number {
    return BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
  }

  /**
   * Check if an error is retryable (rate limit or service unavailable)
   */
  private isRetryableError(error: any): boolean {
    if (error?.status) {
      return RETRYABLE_STATUS_CODES.includes(error.status);
    }
    if (error?.code) {
      return error.code === 'ResourceExhausted' || 
             error.code === 'rate_limit_exceeded' ||
             error.code === 'service_unavailable';
    }
    if (error?.message) {
      const msg = error.message.toLowerCase();
      return msg.includes('rate limit') || 
             msg.includes('resourceexhausted') ||
             msg.includes('service unavailable') ||
             msg.includes('worker local total request limit');
    }
    return false;
  }

  async optimize(request: OptimizationRequest): Promise<OptimizationResponse> {
    const { code, language, astAnalysis, benchmarkReport } = request;

    logger.info('Starting AI optimization', { language });

    let lastError: Error | undefined;
    
    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.executeOptimization(code, language, astAnalysis, benchmarkReport);
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < MAX_RETRIES) {
          const delay = this.getRetryDelay(attempt);
          logger.warn(`AI optimization failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms`, { 
            error: error.message || error,
            status: error?.status,
            code: error?.code
          });
          await this.sleep(delay);
        } else {
          // Non-retryable error or max retries reached
          logger.error('AI optimization failed', { 
            error: error.message || error,
            attempts: attempt + 1,
            isRetryable: this.isRetryableError(error)
          });
          throw error;
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('AI optimization failed after all retries');
  }

  /**
   * Execute a single optimization request
   */
  private async executeOptimization(
    code: string,
    language: string,
    astAnalysis?: any,
    benchmarkReport?: any
  ): Promise<OptimizationResponse> {
    const contextInfo = this.buildContextInfo(astAnalysis, benchmarkReport);
    
    const response = await this.getClient().chat.completions.create({
      model: config.openaiModelName,
      messages: [
        { role: 'system', content: OPTIMIZATION_PROMPT },
        { 
          role: 'user', 
          content: `Optimize this ${language} code for performance and carbon efficiency:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n${contextInfo}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const cleanedContent = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const result = JSON.parse(cleanedContent) as OptimizationResponse;

    logger.info('AI optimization completed', { 
      confidenceScore: result.confidenceScore,
      optimizationsCount: result.optimizationSummary.length 
    });

    return result;
  }

  private buildContextInfo(astAnalysis?: any, benchmarkReport?: any): string {
    let context = '';
    
    if (astAnalysis && astAnalysis.issues?.length > 0) {
      context += '\n\nAST Analysis Issues:\n';
      astAnalysis.issues.forEach((issue: any) => {
        context += `- ${issue.type}: ${issue.message} (line ${issue.line})\n`;
      });
    }
    
    if (benchmarkReport && benchmarkReport.metrics) {
      context += '\n\nBenchmark Metrics:\n';
      context += `- Execution Time: ${benchmarkReport.metrics.executionTime}ms\n`;
      context += `- Memory Usage: ${benchmarkReport.metrics.memoryUsage}MB\n`;
      context += `- CPU Usage: ${benchmarkReport.metrics.cpuUsage}%\n`;
    }
    
    return context;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

export const aiOptimizationService = new AIOptimizationService();

export async function aiOptimizeCode(
  code: string,
  language: string,
  goal: 'performance' | 'memory' | 'readability' | 'balanced',
  context?: string
): Promise<OptimizationResponse> {
  const request: OptimizationRequest = {
    code,
    language,
    goal,
    context,
  };
  return aiOptimizationService.optimize(request);
}
