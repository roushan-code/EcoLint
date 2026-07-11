/**
 * Detects nested loops (for, while, forEach, etc.)
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class NestedLoopsRule extends BaseRule {
  name = 'nested-loops';
  description = 'Detects deeply nested loops';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxNesting = context.config.maxLoopNesting ?? 3;

    // Check for nested for loops using TypeScript's forEachChild
    const checkNode = (node: ts.Node, depth: number = 1): void => {
      if (this.isLoopNode(node)) {
        if (depth > maxNesting) {
          findings.push(this.createFinding(
            context,
            `Nested loop detected with ${depth} levels of nesting (max: ${maxNesting})`,
            node,
            'Consider extracting inner loop into a separate function'
          ));
        }
      }
      ts.forEachChild(node, (child) => checkNode(child, this.isLoopNode(node) ? depth + 1 : depth));
    };

    checkNode(context.sourceFile);

    return findings;
  }

  private isLoopNode(node: ts.Node): boolean {
    return ts.isForStatement(node) ||
           ts.isWhileStatement(node) ||
           ts.isDoStatement(node) ||
           ts.isForInStatement(node) ||
           ts.isForOfStatement(node);
  }
}
