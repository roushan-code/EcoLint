#!/usr/bin/env node

import { showBanner, logger } from './utils/logger.js';
import { parseCli } from './cli.js';
import { promptForSnippet, promptForMode, promptForCustomDirective, promptForSecurityFix } from './interactive.js';
import { readFileSnippet } from './controllers/fileController.js';
import { optimizeSnippet } from './controllers/aiController.js';
import { scanForVulnerabilities, fixVulnerabilities } from './controllers/securityController.js';
import { computeMetrics, printMetrics } from './controllers/metrics.js';
import * as p from '@clack/prompts';
import fs from 'fs/promises';

async function main() {
  showBanner();

  const options = parseCli();

  let originalCode = '';
  let startLine = 1;
  let endLine = -1;
  let fullFileContent = '';
  let isFileMode = false;

  p.intro('Welcome to EcoLint CLI Optimization & Security');

  if (options.file) {
    isFileMode = true;
    const s = p.spinner();
    s.start(`Reading file: ${options.file}`);

    try {
      const result = await readFileSnippet(options.file, options.lines);
      originalCode = result.extractedSnippet;
      fullFileContent = result.fullContent;
      startLine = result.startLine;
      endLine = result.endLine;
      s.stop(`Read ${options.lines ? `lines ${options.lines}` : 'entire file'} from ${options.file}`);
    } catch (e) {
      s.stop('Failed to read file.');
      logger.error(e instanceof Error ? e.message : String(e));
      process.exit(1);
    }
  } else {
    // Interactive mode
    originalCode = await promptForSnippet();
  }

  const mode = await promptForMode();
  const customDirective = await promptForCustomDirective();

  const s2 = p.spinner();
  s2.start('🧠 Processing via AI Optimization Engine...');

  const fileExt = options.file ? options.file.substring(options.file.lastIndexOf('.')).toLowerCase() : undefined;
  const { code: optimizedCode, explanation } = await optimizeSnippet(originalCode, mode as any, customDirective, fileExt);

  s2.stop('Optimization complete!');

  if (mode === 'educational' && explanation) {
    p.note(explanation, 'Educational Breakdown');
  }

  p.note(optimizedCode, 'Optimized Code Result');

  // Compute and print metrics
  const metrics = computeMetrics(originalCode, optimizedCode, mode === 'maximum');
  printMetrics(metrics);

  // If in file mode, handle injection, security scanning, and saving
  if (isFileMode) {
    let finalFileContent = optimizedCode;

    if (options.lines) {
      // We need to inject the optimized snippet back into the original file
      const lines = fullFileContent.split('\n');
      const before = lines.slice(0, startLine - 1);
      const after = lines.slice(endLine);
      finalFileContent = [...before, optimizedCode, ...after].join('\n');
    }

    // 🔒 Security Scan Phase
    const secSpinner = p.spinner();
    secSpinner.start('🔒 Scanning entire file for security vulnerabilities...');
    const secResult = await scanForVulnerabilities(finalFileContent);

    if (secResult.hasVulnerabilities) {
      secSpinner.stop('Vulnerabilities detected!');
      
      const shouldFix = await promptForSecurityFix(secResult.explanation);
      if (shouldFix) {
        const fixSpinner = p.spinner();
        fixSpinner.start('🛠️ Applying security patches...');
        finalFileContent = await fixVulnerabilities(finalFileContent, secResult.explanation);
        fixSpinner.stop('Security patches applied successfully!');
      } else {
        p.outro('Security fix declined. Exiting without saving.');
        process.exit(0);
      }
    } else {
      secSpinner.stop('No vulnerabilities found. Code is secure!');
      
      const shouldSave = await p.confirm({
        message: 'Do you want to overwrite the original file with this optimized snippet?',
        initialValue: false
      });

      if (!shouldSave) {
        p.outro('Optimization complete. Exiting without saving.');
        process.exit(0);
      }
    }

    const s3 = p.spinner();
    s3.start('Saving changes...');
    await fs.writeFile(options.file!, finalFileContent, 'utf-8');
    s3.stop(`Saved successfully to ${options.file!}`);
  }

  p.outro('Thank you for using EcoLint CLI!');
}

main().catch(e => {
  logger.error('Unhandled error: ' + String(e));
  process.exit(1);
});
