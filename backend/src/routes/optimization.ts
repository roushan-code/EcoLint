import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { optimizeCode } from '../utils/optimizer.js';
import { OptimizationRequest, ApiResponse, OptimizationResult } from '../types/index.js';
import { logger } from '../infrastructure/logger.js';
import { aiOptimizeCode } from '../services/aiOptimizationService.js';
import { smartOptimizationService, SmartOptimizationResult } from '../services/smartOptimizationService.js';

const router = Router();

const optimizationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  goal: z.enum(['performance', 'memory', 'readability', 'balanced', 'carbon']).optional().default('carbon'),
  useSmartOptimization: z.boolean().optional().default(true),
});

const aiOptimizationSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
  goal: z.enum(['performance', 'memory', 'readability', 'balanced', 'carbon']),
  context: z.string().optional(),
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Log raw request body for debugging
    logger.info('Optimization request received', { body: req.body });
    
    const validation = optimizationSchema.safeParse(req.body);
    
    if (!validation.success) {
      logger.error('Validation failed', { error: validation.error.message, issues: validation.error.issues });
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.message,
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const { code, language, goal, useSmartOptimization } = validation.data as OptimizationRequest & { useSmartOptimization?: boolean };
    const fileName = req.body.fileName || '';
    
    logger.info('Optimizing code', { language, goal, useSmartOptimization });

    // Use smart optimization with LLM + sandbox + retry logic
    if (useSmartOptimization) {
      try {
        // Convert goal to supported types
        const smartGoal: 'performance' | 'carbon' = goal === 'carbon' ? 'carbon' : 'performance';
        const smartResult: SmartOptimizationResult = await smartOptimizationService.optimize(code, language, smartGoal);
        
        const response: ApiResponse<SmartOptimizationResult> = {
          success: smartResult.success,
          data: smartResult,
          timestamp: new Date().toISOString(),
        };
        
        if (!smartResult.success) {
          logger.warn('Smart optimization returned failure', { error: smartResult.error });
          res.status(400).json(response);
        } else {
          res.json(response);
        }
      } catch (optimizationError) {
        logger.error('Smart optimization threw error', { error: optimizationError });
        const response: ApiResponse<null> = {
          success: false,
          error: optimizationError instanceof Error ? optimizationError.message : 'Optimization failed',
          timestamp: new Date().toISOString(),
        };
        res.status(500).json(response);
      }
      return;
    }

    // Fallback to basic optimization
    const result: OptimizationResult = optimizeCode(code, language, goal);
    result.fileName = fileName;
    
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
