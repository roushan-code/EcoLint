import { Command } from 'commander';

export interface CliOptions {
  file?: string;
  lines?: string;
}

export function parseCli(): CliOptions {
  const program = new Command();

  program
    .name('ecolint')
    .description('Terminal-Based Performance & AI FinOps Optimizer')
    .version('1.0.0')
    .option('-f, --file <path>', 'Target file to scan and optimize')
    .option('-l, --lines <range>', 'Specific line range (e.g., 12-35) to optimize within the file');

  program.parse();
  return program.opts() as CliOptions;
}
