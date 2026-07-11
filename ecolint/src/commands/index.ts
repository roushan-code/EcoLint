import { ExtensionContext, commands, OutputChannel } from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { AnalyzeCommand } from './analyzeCommand.js';
import { BenchmarkCommand } from './benchmarkCommand.js';
import { OptimizeCommand } from './optimizeCommand.js';
import { GeneratePullRequestCommand } from './generatePullRequestCommand.js';
import { ValidateCommand } from './validateCommand.js';
import { OrchestratorCommand } from './orchestratorCommand.js';
import { AnalysisEngine } from '../analysis/engine.js';
import { ValidationAgent } from '../services/validationAgent.js';
import { ApiService } from '../services/apiService.js';

export function registerCommands(
  context: ExtensionContext,
  logger: Logger,
  outputChannel: OutputChannel
): void {
  logger.info('Registering commands...');

  // Create service instances
  const analysisEngine = new AnalysisEngine({});
  const validationAgent = new ValidationAgent(logger);
  const apiService = new ApiService(logger);

  // Create command instances
  const analyzeCommand = new AnalyzeCommand(logger, outputChannel);
  const benchmarkCommand = new BenchmarkCommand(logger, outputChannel);
  const optimizeCommand = new OptimizeCommand(logger, outputChannel);
  const generatePullRequestCommand = new GeneratePullRequestCommand(logger, outputChannel);
  const validateCommand = new ValidateCommand(logger);
  const orchestratorCommand = new OrchestratorCommand(logger, analysisEngine, validationAgent, apiService);

  // Register commands
  const disposableAnalyze = commands.registerCommand('ecolint.analyze', async () => {
    await analyzeCommand.execute();
  });

  const disposableBenchmark = commands.registerCommand('ecolint.benchmark', async () => {
    await benchmarkCommand.execute();
  });

  const disposableOptimize = commands.registerCommand('ecolint.optimize', async () => {
    await optimizeCommand.execute();
  });

  const disposableGeneratePR = commands.registerCommand('ecolint.generatePullRequest', async () => {
    await generatePullRequestCommand.execute();
  });

  const disposableValidate = commands.registerCommand('ecolint.validate', async () => {
    await validateCommand.execute();
  });

  // Register orchestrator command
  orchestratorCommand.register(context);

  // Add to subscriptions
  context.subscriptions.push(
    disposableAnalyze,
    disposableBenchmark,
    disposableOptimize,
    disposableGeneratePR,
    disposableValidate
  );

  logger.info('Commands registered successfully');
}
