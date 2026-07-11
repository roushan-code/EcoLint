import { ExtensionContext, window } from 'vscode';
import { Logger } from './infrastructure/logger.js';
import { ErrorHandler } from './infrastructure/errorHandler.js';
import { registerCommands } from './commands/index.js';
import { registerOutputChannel } from './views/outputChannel.js';
import { registerTreeView } from './views/treeView.js';
import { registerStatusBar } from './views/statusBar.js';

export async function activate(context: ExtensionContext): Promise<void> {
  const logger = new Logger();
  const errorHandler = new ErrorHandler(logger);
  const outputChannel = registerOutputChannel();

  logger.setOutputChannel(outputChannel);
  logger.info('EcoLint extension activating...');

  try {
    // Register tree view
    registerTreeView();

    // Register status bar
    registerStatusBar(logger);

    // Register commands
    registerCommands(context, logger, outputChannel);

    // Show welcome message
    void window.showInformationMessage('EcoLint extension activated!');

    logger.info('EcoLint extension activated successfully');
  } catch (error) {
    errorHandler.handleError(error, 'Activation failed');
    throw error;
  }
}