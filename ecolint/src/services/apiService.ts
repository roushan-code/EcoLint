import { Logger } from '../infrastructure/logger.js';
import { ConfigurationService } from '../config/configurationService.js';
import type { AnalysisResult, BenchmarkResult, OptimizationResult, PullRequestPayload, PullRequestResponse } from '../types/index.js';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiService {
  private readonly logger: Logger;
  private readonly configService: ConfigurationService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.configService = new ConfigurationService();
  }

  public async analyzeCode(code: string, language: string, fileName: string): Promise<ApiResponse<AnalysisResult>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, fileName }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json() as AnalysisResult;
      return { success: true, data };
    } catch (error) {
      this.logger.error('Analysis API call failed', error);
      return { success: false, error: String(error) };
    }
  }

  public async runBenchmark(code: string, language: string, fileName: string): Promise<ApiResponse<BenchmarkResult>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, fileName }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json() as BenchmarkResult;
      return { success: true, data };
    } catch (error) {
      this.logger.error('Benchmark API call failed', error);
      return { success: false, error: String(error) };
    }
  }

  public async optimizeCode(code: string, language: string, fileName: string): Promise<ApiResponse<OptimizationResult>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, fileName }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json() as OptimizationResult;
      return { success: true, data };
    } catch (error) {
      this.logger.error('Optimization API call failed', error);
      return { success: false, error: String(error) };
    }
  }

  public async generatePullRequest(payload: PullRequestPayload): Promise<ApiResponse<PullRequestResponse>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/github/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json() as PullRequestResponse;
      return { success: true, data };
    } catch (error) {
      this.logger.error('PR generation API call failed', error);
      return { success: false, error: String(error) };
    }
  }
}