import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { analyzeCode } from '../utils/codeAnalyzer.js';
import { AnalysisRequest, ApiResponse, AnalysisResult } from '../types/index.js';
import { logger } from '../infrastructure/logger.js';

const router = Router();

const analysisSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  options: z.object({
    includePerformanceMetrics: z.boolean().optional(),
    includeSecurityChecks: z.boolean().optional(),
    includeBestPractices: z.boolean().optional(),
  }).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = analysisSchema.safeParse(req.body);
    
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.message,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { code, language, options } = validation.data as AnalysisRequest;
    
    logger.info('Analyzing code', { language, options });
    
    const result: AnalysisResult = analyzeCode(code, language);
    
    const response: ApiResponse<AnalysisResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Analysis failed', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;