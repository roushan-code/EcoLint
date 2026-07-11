import { ExtensionContext, commands, OutputChannel } from 'vscode';
import { Logger } from '../infrastructure/logger.js';
import { AnalyzeCommand } from './analyzeCommand.js';
import { BenchmarkCommand } from './benchmarkCommand.js';
import { OptimizeCommand } from './optimizeCommand.js';
import { GeneratePullRequestCommand } from './generatePullRequestCommand.js';

export function registerCommands(
  context: ExtensionContext,
  logger: Logger,
  outputChannel: OutputChannel
): void {
  logger.info('Registering commands...');

  // Create command instances
  const analyzeCommand = new AnalyzeCommand(logger, outputChannel);
  const benchmarkCommand = new BenchmarkCommand(logger, outputChannel);
  const optimizeCommand = new OptimizeCommand(logger, outputChannel);
  const generatePullRequestCommand = new GeneratePullRequestCommand(logger, outputChannel);

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

  // Add to subscriptions
  context.subscriptions.push(
    disposableAnalyze,
    disposableBenchmark,
    disposableOptimize,
    disposableGeneratePR
  );

  logger.info('Commands registered successfully');
}