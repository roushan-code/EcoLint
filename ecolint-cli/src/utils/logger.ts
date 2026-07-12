import chalk from 'chalk';
import figlet from 'figlet';

export const logger = {
  info: (msg: string) => console.log(chalk.blue(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  error: (msg: string) => console.log(chalk.red(msg)),
  log: (msg: string) => console.log(msg)
};

export function showBanner() {
  console.log(chalk.green(figlet.textSync('EcoLint CLI', { horizontalLayout: 'full' })));
  console.log(chalk.gray('Terminal-Based Performance & AI FinOps Optimizer\n'));
}
