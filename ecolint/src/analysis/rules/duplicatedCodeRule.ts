/**
 * Detects duplicated code blocks
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class DuplicatedCodeRule extends BaseRule {
  name = 'duplicated-code';
  description = 'Detects duplicated code blocks';
  severity = 'info' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const threshold = context.config.duplicateCodeThreshold ?? 5;

    const codeBlocks: Map<string, ts.Node[]> = new Map();

    const findFunctions = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const body = node.body;
        if (body && ts.isBlock(body)) {
          const code = this.normalizeCode(body.getFullText());
          if (code.length > threshold * 10) {
            const existing = codeBlocks.get(code);
            if (existing) {
              existing.push(node);
            } else {
              codeBlocks.set(code, [node]);
            }
          }
        }
      }
      ts.forEachChild(node, findFunctions);
    };

    findFunctions(context.sourceFile);

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
      .replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, 'X')
      .replace(/[0-9]+/g, 'N')
      .trim();
  }
}