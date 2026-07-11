/**
 * Detects deep nesting
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class DeepNestingRule extends BaseRule {
  name = 'deep-nesting';
  description = 'Detects excessive code nesting';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxDepth = context.config.maxNestingDepth ?? 4;

    context.sourceFile.forEachDescendant((node: any) => {
      const depth = this.calculateNestingDepth(node);
      if (depth > maxDepth) {
        findings.push(this.createFinding(
          context,
          `Code nesting depth is ${depth} (max: ${maxDepth})`,
          node,
          'Consider refactoring with early returns or extracting to separate functions'
        ));
      }
    });

    return findings;
  }

  private calculateNestingDepth(node: any): number {
    let depth = 0;
    let current = node.getParent?.();
    
    const nestingKinds = [
      'IfStatement', 'ElseClause', 'ForStatement', 'WhileStatement', 
      'DoStatement', 'ForInStatement', 'ForOfStatement', 'TryStatement',
      'CatchClause', 'WithStatement', 'SwitchStatement', 'CaseClause'
    ];

    while (current) {
      const kind = current.getKindName?.() || '';
      if (nestingKinds.includes(kind)) {
        depth++;
      }
      current = current.getParent?.();
    }

    return depth;
  }
}