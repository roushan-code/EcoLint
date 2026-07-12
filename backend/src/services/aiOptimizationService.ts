import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../infrastructure/logger';
import type { OptimizationRequest, OptimizationResponse, OptimizationItem } from '../types/optimization';

const OPTIMIZATION_PROMPT = `You are an expert code optimization assistant specializing in security, performance, and HFT (High-Frequency Trading) systems. Your task is to analyze code and provide optimized versions that improve performance, reduce carbon footprint, maintain readability, and eliminate vulnerabilities.

Analyze the provided code and return a JSON response with:
1. "optimizedCode": The improved code
2. "explanation": A brief explanation of the changes
3. "optimizationSummary": Array of specific optimizations made (type, before, after, impact)
4. "confidenceScore": A number 0-1 indicating confidence in the optimization
5. "retryHints": Suggestions for further improvements if needed

## SECURITY VULNERABILITY DETECTION

### Memory Safety Issues (C/C++/Rust):
- Buffer overflow/underflow
- Use after free / double free
- Null pointer dereference
- Uninitialized memory access
- Stack smashing / heap corruption
- Integer overflow/underflow
- Format string vulnerabilities (printf without format specifiers)
- Unaligned memory access
- TOCTOU (Time-of-check to time-of-use)

### Injection Attacks:
- SQL/NoSQL injection
- Command injection (system(), exec(), eval())
- LDAP/XML/XXE injection
- Path traversal
- Template injection
- Deserialization attacks

### Cryptographic Issues:
- Weak encryption (DES, RC4, MD5)
- Hardcoded keys/secrets/passwords
- Insecure random number generation
- Missing HMAC verification
- Improper key management
- ECB mode usage

### Concurrency Issues:
- Race conditions
- Deadlocks
- Improper mutex/lock usage
- Thread safety violations
- Atomic operation misuse

## ALGORITHM CORRECTNESS VALIDATION

### Mathematical Formula Verification:
- Fibonacci series implementation correctness
- Sorting algorithm validation
- Mathematical formula errors
- Hardcoded algorithm results (e.g., return 55 for Fibonacci)
- Edge case handling (n=0, n=1, negative values)

## HFT & ULTRA-LOW LATENCY OPTIMIZATIONS

### Lock-Free Data Structures:
- MPSC/SPSC queues
- Compare-and-swap (CAS) operations
- Atomic operations (fetch_add, compare_exchange)
- Memory barriers/ordering
- Hazard pointers
- RCU (Read-Copy-Update)

### Cache Optimization:
- Cache line alignment/padding
- False sharing elimination
- Cache coherence optimization
- TLB optimization
- Cache prefetch hints
- NUMA awareness

### CPU-Specific Optimizations:
- SIMD/AVX/AVX-512 instructions
- Branchless programming
- Loop unrolling
- Instruction scheduling
- Register allocation
- CPU affinity

### Memory Management:
- Huge pages (2MB, 1GB)
- Memory pools/arena allocation
- Object pooling
- Zero-copy operations
- DMA optimization

### Network Optimization (HFT):
- Kernel bypass (DPDK, AF_XDP)
- Polling vs interrupts
- Batch processing
- Zero-copy networking

## SYSTEM-LEVEL C OPTIMIZATIONS

### Hardware-Level Optimizations:
- Bit-level operations
- Endianness handling
- Register allocation optimization
- CPU pipeline optimization
- Instruction cache optimization

### Pointer & Memory:
- Pointer arithmetic safety
- Strict aliasing rules
- Memory alignment
- Stack vs heap decisions

### Printf Security & Minimal Includes:
\`\`\`c
// Instead of #include<stdio.h>, use forward declaration for minimal binary
int printf(const char *, ...);

// VULNERABLE - Format string attack
printf(user_input);

// SECURE - Proper format specifier
printf("%s", user_input);
\`\`\`

### Minimal Header Pattern:
- Use forward declarations instead of includes when possible
- Reduces binary size and compile time
- Example: \`int printf(const char *, ...);\` instead of \`#include<stdio.h>\`
- Only include full headers when macro definitions are needed

### Performance Anti-patterns:
- O(n²) → O(n) optimizations
- N+1 query detection
- Memory allocation patterns
- CPU cache misses
- Branch prediction misses

## LANGUAGE-SPECIFIC RULES

### C/C++:
- Inline assembly hints
- restrict keyword usage
- const correctness
- Move semantics (C++)

### Python:
- GIL awareness
- List vs generator
- NumPy vectorization
- Cython opportunities

### JavaScript:
- V8 optimization hints
- Hidden class optimization
- Monomorphic calls

## RESPONSE FORMAT

Return ONLY valid JSON with this structure:
{
  "optimizedCode": "string",
  "explanation": "string",
  "optimizationSummary": [
    {
      "type": "security|performance|algorithm|hft|system",
      "before": "string",
      "after": "string",
      "impact": "high|medium|low",
      "severity": "critical|high|medium|low"
    }
  ],
  "confidenceScore": 0.0-1.0,
  "retryHints": "string"
}

Focus on:
- Security vulnerabilities first (critical issues)
- Algorithm correctness validation
- Reducing algorithmic complexity (O(n²) → O(n), etc.)
- HFT/lock-free optimizations for system languages
- Minimizing memory allocations
- Cache efficiency
- Branch prediction optimization
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
