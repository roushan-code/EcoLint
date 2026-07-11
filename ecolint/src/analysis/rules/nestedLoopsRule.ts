/**
 * Detects nested loops (for, while, forEach, etc.)
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class NestedLoopsRule extends BaseRule {
  name = 'nested-loops';
  description = 'Detects deeply nested loops';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxNesting = context.config.maxLoopNesting ?? 3;

    // Check for nested for loops
    context.sourceFile.forEachDescendant((node: any) => {
      if (this.isLoopNode(node)) {
        const nesting = this.getLoopNesting(node);
        if (nesting > maxNesting) {
          findings.push(this.createFinding(
            context,
            `Nested loop detected with ${nesting} levels of nesting (max: ${maxNesting})`,
            node,
            'Consider extracting inner loop into a separate function'
          ));
        }
      }
    });

    return findings;
  }

  private isLoopNode(node: any): boolean {
    const kind = node.getKindName?.() || '';
    return ['ForStatement', 'WhileStatement', 'DoStatement', 'ForInStatement', 'ForOfStatement'].includes(kind);
  }

  private getLoopNesting(node: any): number {
    let depth = 1;
    let parent = node.getParent?.();
    
    while (parent) {
      if (this.isLoopNode(parent)) {
        depth++;
      }
      parent = parent.getParent?.();
    }
    
    return depth;
  }
}