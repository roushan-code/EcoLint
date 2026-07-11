import { app } from './app.js';
import { config } from './config.js';
import { logger } from './infrastructure/logger.js';
import analysisRoutes from './routes/analysis.js';
import optimizationRoutes from './routes/optimization.js';

// Mount routes
app.use('/api/v1/analysis', analysisRoutes);
app.use('/api/v1/optimization', optimizationRoutes);

// Start server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    nodeEnv: config.nodeEnv,
    logLevel: config.logLevel,
  });
});