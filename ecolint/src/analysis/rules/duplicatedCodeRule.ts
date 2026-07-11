/**
 * Detects duplicated code blocks
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class DuplicatedCodeRule extends BaseRule {
  name = 'duplicated-code';
  description = 'Detects duplicated code blocks';
  severity = 'info' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const threshold = context.config.duplicateCodeThreshold ?? 5;

    // Get all function and arrow function bodies
    const functions = context.sourceFile.getDescendantsOfKind(
      context.sourceFile.getLanguageVariant() === 0 ? 193 : 194 // FunctionDeclaration/ArrowFunction
    );

    const codeBlocks: Map<string, any[]> = new Map();

    for (const func of functions) {
      const body = func.getBody?.();
      if (body) {
        const code = this.normalizeCode(body.getFullText?.() || '');
        if (code.length > threshold * 10) { // Minimum block size
          const existing = codeBlocks.get(code);
          if (existing) {
            existing.push(func);
          } else {
            codeBlocks.set(code, [func]);
          }
        }
      }
    }

    // Report duplicates
    for (const [_code, nodes] of codeBlocks) {
      if (nodes.length > 1) {
        for (const node of nodes) {
          findings.push(this.createFinding(
            context,
            `Duplicated code block found (${nodes.length} occurrences)`,
            node,
            'Consider extracting this code into a shared function'
          ));
        }
      }
    }

    return findings;
  }

  private normalizeCode(code: string): string {
    return code
      .replace(/\s+/g, ' ')
      .replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, 'X') // Replace identifiers
      .replace(/[0-9]+/g, 'N') // Replace numbers
      .trim();
  }
}