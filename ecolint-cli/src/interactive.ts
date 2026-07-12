import * as p from '@clack/prompts';
import { setTimeout } from 'timers/promises';

export type OptMode = 'maximum' | 'balanced' | 'educational';

export async function promptForSnippet(): Promise<string> {
  const snippet = await p.text({
    message: 'Paste your raw code snippet to optimize:',
    placeholder: 'function slow() { ... }',
    validate: (value) => {
      if (!value) return 'Code snippet is required.';
    },
  });

  if (p.isCancel(snippet)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return snippet as string;
}

export async function promptForMode(): Promise<OptMode> {
  const mode = await p.select({
    message: 'Select Optimization Tuning Mode:',
    options: [
      {
        value: 'maximum',
        label: '🚀 Maximum Performance (Raw Optimization)',
        hint: 'Optimize for speed/CPU/memory at all costs (ignores readability)'
      },
      {
        value: 'balanced',
        label: '⚖️  Balanced Production (Optimized + Readable)',
        hint: 'High performance while maintaining clean architecture & readability'
      },
      {
        value: 'educational',
        label: '📚 Educational (Optimized + Readable + Deep Explanation)',
        hint: 'Balanced mode with a comprehensive breakdown of technical choices'
      }
    ],
  });

  if (p.isCancel(mode)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return mode as OptMode;
}

export async function promptForCustomDirective(): Promise<string | undefined> {
  const directive = await p.text({
    message: 'Any specific instructions? (e.g. "Do not remove comments", "Use a Set"):',
    placeholder: 'Press Enter to skip...',
    validate: () => undefined // Always valid since it's optional
  });

  if (p.isCancel(directive)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return (directive as string).trim() || undefined;
}

export async function promptForSecurityFix(explanation: string): Promise<boolean> {
  const shouldFix = await p.confirm({
    message: `Security vulnerabilities detected:\n${explanation}\n\nDo you want me to automatically fix these vulnerabilities?`,
    initialValue: true
  });

  if (p.isCancel(shouldFix)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return shouldFix as boolean;
}
