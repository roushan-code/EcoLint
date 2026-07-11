import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { optimizeCode } from '../utils/optimizer.js';
import { OptimizationRequest, ApiResponse, OptimizationResult } from '../types/index.js';
import { logger } from '../infrastructure/logger.js';
import { aiOptimizeCode } from '../services/aiOptimizationService.js';

const router = Router();

const optimizationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  goal: z.enum(['performance', 'memory', 'readability', 'balanced']),
});

const aiOptimizationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  goal: z.enum(['performance', 'memory', 'readability', 'balanced']),
  context: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = optimizationSchema.safeParse(req.body);
    
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.message,
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const { code, language, goal } = validation.data as OptimizationRequest;
    
    logger.info('Optimizing code', { language, goal });
    
    const result: OptimizationResult = optimizeCode(code, language, goal);
    
    const response: ApiResponse<OptimizationResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Optimization failed', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;