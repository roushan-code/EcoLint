/**
 * Benchmark Routes
 * API endpoints for code execution benchmarking
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { BenchmarkService } from '../services/benchmarkService';
import { logger } from '../infrastructure/logger';

const router = Router();

// Validation schema
const benchmarkSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  timeout: z.number().optional(),
});

/**
 * POST /api/benchmark
 * Execute code and return benchmark results
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = benchmarkSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const { code, language, timeout } = validation.data;
    
    logger.info(`Benchmark request for language: ${language}`);
    
    const result = await BenchmarkService.executeBenchmark({
      code,
      language,
      timeout,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Benchmark error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Benchmark failed',
    });
  }
});

/**
 * GET /api/benchmark/languages
 * Get list of supported languages
 */
router.get('/languages', (_req: Request, res: Response) => {
  const languages = BenchmarkService.getSupportedLanguages();
  res.json({
    success: true,
    data: languages,
  });
});

export default router;