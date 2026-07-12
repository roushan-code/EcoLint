import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateDiff, acceptAll, rejectAll, applyChanges } from '../services/diffService.js';
import type { DiffResult, AcceptRejectResult } from '../types/diff.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../infrastructure/logger.js';

const router = Router();

const diffSchema = z.object({
  originalCode: z.string().min(1),
  optimizedCode: z.string().min(1),
});

const acceptRejectSchema = z.object({
  originalCode: z.string().min(1),
  optimizedCode: z.string().min(1),
  action: z.enum(['accept', 'reject']),
  diffIndex: z.number().optional(),
});

/**
 * POST /diff - Generate diff between original and optimized code
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = diffSchema.safeParse(req.body);
    
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.message,
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const { originalCode, optimizedCode } = validation.data;
    
    logger.info('Generating diff', { 
      originalLength: originalCode.length, 
      optimizedLength: optimizedCode.length 
    });
    
    const diffResult: DiffResult = generateDiff(originalCode, optimizedCode);
    
    const response: ApiResponse<DiffResult> = {
      success: true,
      data: diffResult,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Diff generation failed', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * POST /diff/accept - Accept and apply optimization
 */
router.post('/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = acceptRejectSchema.safeParse(req.body);
    
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.message,
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const { originalCode, optimizedCode, diffIndex } = validation.data;
    
    logger.info('Accepting changes', { diffIndex });
    
    let result: AcceptRejectResult;
    
    if (diffIndex !== undefined) {
      // Accept specific diff only
      result = applyChanges(originalCode, optimizedCode, [diffIndex]);
    } else {
      // Accept all changes
      result = acceptAll(originalCode, optimizedCode);
    }
    
    const response: ApiResponse<AcceptRejectResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Accept failed', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * POST /diff/reject - Reject and keep original
 */
router.post('/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = acceptRejectSchema.safeParse(req.body);
    
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error.message,
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const { originalCode } = validation.data;
    
    logger.info('Rejecting changes');
    
    const result: AcceptRejectResult = rejectAll(originalCode);
    
    const response: ApiResponse<AcceptRejectResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Reject failed', { error });
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;