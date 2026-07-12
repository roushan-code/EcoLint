import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './infrastructure/logger.js';
import { createBenchmarkRoutes } from './routes/benchmark.js';
import optimizationRouter from './routes/optimization.js';
import analysisRouter from './routes/analysis.js';
import diffRouter from './routes/diff.js';
import { BenchmarkService } from './services/benchmarkService.js';

export const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize services and routes
const benchmarkService = new BenchmarkService({
  e2b: {
    apiKey: process.env.E2B_API_KEY || '',
    timeout: parseInt(process.env.SANDBOX_TIMEOUT || '30000', 10),
    maxMemory: parseInt(process.env.SANDBOX_MAX_MEMORY || '512', 10),
  },
  gridCarbonIntensity: parseInt(process.env.GRID_CARBON_INTENSITY || '450', 10),
});
const benchmarkRouter = createBenchmarkRoutes(benchmarkService);

// API routes
app.use('/api/benchmark', benchmarkRouter);
app.use('/api/optimize', optimizationRouter);
app.use('/api/analyze', analysisRouter);
app.use('/api/diff', diffRouter);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});