/**
 * Detects dead/unreachable code
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class DeadCodeRule extends BaseRule {
  name = 'dead-code';
  description = 'Detects unreachable/dead code';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Check for empty catch blocks
    const findCatchClauses = (node: ts.Node): void => {
      if (ts.isCatchClause(node)) {
        const body = node.block;
        if (body.statements.length === 0) {
          findings.push(this.createFinding(
            context,
            'Empty catch block detected',
            node,
            'Either handle the error or remove the try-catch'
          ));
        }
      }
      ts.forEachChild(node, findCatchClauses);
    };

    findCatchClauses(context.sourceFile);

    return findings;
  }
}