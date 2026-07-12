import { Logger } from '../infrastructure/logger.js';
import { ConfigurationService } from '../config/configurationService.js';
import type { AnalysisResult, BenchmarkResult, OptimizationResult, PullRequestPayload, PullRequestResponse } from '../types/index.js';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

interface BackendResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
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
      const response = await fetch(`${endpoint}/api/v1/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, fileName }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const backendResponse = await response.json() as BackendResponse<AnalysisResult>;
      if (!backendResponse.success || !backendResponse.data) {
        return { success: false, error: backendResponse.error || 'Analysis failed' };
      }
      return { success: true, data: backendResponse.data };
    } catch (error) {
      this.logger.error('Analysis API call failed', error);
      return { success: false, error: String(error) };
    }
  }

  public async runBenchmark(code: string, language: string, fileName: string): Promise<ApiResponse<BenchmarkResult>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/v1/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, fileName }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const backendResponse = await response.json() as BackendResponse<BenchmarkResult>;
      if (!backendResponse.success || !backendResponse.data) {
        return { success: false, error: backendResponse.error || 'Benchmark failed' };
      }
      return { success: true, data: backendResponse.data };
    } catch (error) {
      this.logger.error('Benchmark API call failed', error);
      return { success: false, error: String(error) };
    }
  }

  public async optimizeCode(code: string, language: string, fileName: string): Promise<ApiResponse<OptimizationResult>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/v1/optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, fileName }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const backendResponse = await response.json() as BackendResponse<OptimizationResult>;
      if (!backendResponse.success || !backendResponse.data) {
        return { success: false, error: backendResponse.error || 'Optimization failed' };
      }
      return { success: true, data: backendResponse.data };
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

  public async generateDiff(originalCode: string, optimizedCode: string): Promise<ApiResponse<any>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/diff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalCode, optimizedCode }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      this.logger.error('Diff API call failed', error);
      return { success: false, error: String(error) };
    }
  }

  public async acceptChanges(originalCode: string, optimizedCode: string, diffIndex?: number): Promise<ApiResponse<any>> {
    try {
      const endpoint = this.configService.getApiEndpoint();
      const response = await fetch(`${endpoint}/api/diff/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalCode, optimizedCode, action: 'accept', diffIndex }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      this.logger.error('Accept changes API call failed', error);
      return { success: false, error: String(error) };
    }
  }
}
