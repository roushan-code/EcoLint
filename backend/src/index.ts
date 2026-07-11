import { app } from './app.js';
import { config } from './config.js';
import { logger } from './infrastructure/logger.js';
import { BenchmarkService } from './services/benchmarkService.js';
import { createBenchmarkRoutes } from './routes/benchmark.js';
import analysisRoutes from './routes/analysis.js';
import optimizationRoutes from './routes/optimization.js';

// Initialize benchmark service
const benchmarkService = new BenchmarkService({
  defaultTimeout: config.benchmarkTimeout || 30000,
  e2b: {
    apiKey: config.e2bApiKey || '',
    timeout: config.benchmarkTimeout || 30000,
    maxMemory: 512,
  },
  gridCarbonIntensity: config.gridCarbonIntensity || 450,
});

// Mount routes
app.use('/api/v1/benchmark', createBenchmarkRoutes(benchmarkService));
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/optimization', optimizationRoutes);

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
    e2bConfigured: benchmarkService.isE2BConfigured(),
  });
});