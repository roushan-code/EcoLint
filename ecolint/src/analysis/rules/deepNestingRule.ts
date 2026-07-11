/**
 * Detects deep nesting
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class DeepNestingRule extends BaseRule {
  name = 'deep-nesting';
  description = 'Detects excessive code nesting';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxDepth = context.config.maxNestingDepth ?? 4;

    const checkNesting = (node: ts.Node, _depth: number): void => {
      const currentDepth = this.getNestingDepth(node);
      if (currentDepth > maxDepth) {
        findings.push(this.createFinding(
          context,
          `Code nesting depth is ${currentDepth} (max: ${maxDepth})`,
          node,
          'Consider refactoring with early returns or extracting to separate functions'
        ));
      }
      ts.forEachChild(node, (child) => checkNesting(child, currentDepth));
    };

    checkNesting(context.sourceFile, 0);

    return findings;
  }

  private getNestingDepth(node: ts.Node): number {
    let depth = 0;
    let current = node.parent;
    
    while (current) {
      if (ts.isIfStatement(current) || ts.isForStatement(current) || 
          ts.isWhileStatement(current) || ts.isDoStatement(current) ||
          ts.isForInStatement(current) || ts.isForOfStatement(current) ||
          ts.isTryStatement(current) || ts.isCatchClause(current) ||
          ts.isWithStatement(current) || ts.isSwitchStatement(current)) {
        depth++;
      }
      current = current.parent;
    }

    return depth;
  }
}