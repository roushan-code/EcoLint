/**
 * Benchmark Routes
 * 
 * REST API endpoints for code benchmarking and carbon estimation.
 */

import { Router, Request, Response } from 'express';
import { BenchmarkService } from '../services/benchmarkService';
import { BenchmarkRequest } from '../types/benchmark';
import { logger } from '../infrastructure/logger';

export function createBenchmarkRoutes(benchmarkService: BenchmarkService): Router {
  const router = Router();

  /**
   * POST /api/benchmark
   * Execute a code benchmark
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const request: BenchmarkRequest = req.body;

      if (!request.code || !request.language) {
        res.status(400).json({
          error: 'Missing required fields: code and language are required',
        });
        return;
      }

      const report = await benchmarkService.executeBenchmark(request);
      res.json(report);
    } catch (error) {
      logger.error('Benchmark execution failed', { error });
      res.status(500).json({
        error: 'Benchmark execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/benchmark/languages
   * Get list of supported languages
   */
  router.get('/languages', (_req: Request, res: Response) => {
    const languages = benchmarkService.getSupportedLanguages();
    res.json(languages);
  });

  /**
   * POST /api/benchmark/compare
   * Compare two benchmark reports
   */
  router.post('/compare', (req: Request, res: Response) => {
    try {
      const { benchmarkA, benchmarkB } = req.body;

      if (!benchmarkA || !benchmarkB) {
        res.status(400).json({
          error: 'Both benchmarkA and benchmarkB are required',
        });
        return;
      }

      const comparison = benchmarkService.compareBenchmarks(benchmarkA, benchmarkB);
      res.json(comparison);
    } catch (error) {
      logger.error('Benchmark comparison failed', { error });
      res.status(500).json({
        error: 'Benchmark comparison failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/benchmark/config
   * Get benchmark service configuration
   */
  router.get('/config', (_req: Request, res: Response) => {
    res.json({
      e2bConfigured: benchmarkService.isE2BConfigured(),
      carbonEstimator: benchmarkService.getCarbonEstimatorConfig(),
    });
  });

  return router;
}