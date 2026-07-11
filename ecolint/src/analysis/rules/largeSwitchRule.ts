/**
 * Detects large switch statements
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class LargeSwitchRule extends BaseRule {
  name = 'large-switch';
  description = 'Detects large switch statements';
  severity = 'info' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxCases = context.config.maxSwitchCases ?? 10;

    const checkNode = (node: ts.Node): void => {
      if (ts.isSwitchStatement(node)) {
        const clauses = node.caseBlock.clauses;
        const caseCount = clauses.filter(ts.isCaseClause).length;

        if (caseCount > maxCases) {
          findings.push(this.createFinding(
            context,
            `Switch statement has ${caseCount} cases (max: ${maxCases})`,
            node,
            'Consider using a lookup object/map or polymorphism for better maintainability'
          ));
        }

        // Check for switch statements that could be replaced with objects
        if (caseCount > 3 && this.couldBeObjectPattern(node)) {
          findings.push(this.createFinding(
            context,
            'Switch statement could potentially be replaced with a lookup object',
            node,
            'Consider using a Map or object for O(1) lookup instead of O(n)'
          ));
        }
      }

      ts.forEachChild(node, checkNode);
    };

    checkNode(context.sourceFile);

    return findings;
  }

  private couldBeObjectPattern(node: ts.SwitchStatement): boolean {
    const clauses = node.caseBlock.clauses.filter(ts.isCaseClause);
    let simpleValueCount = 0;

    for (const clause of clauses) {
      if (clause.statements.length === 1) {
        const stmt = clause.statements[0];
        if (stmt && (ts.isReturnStatement(stmt) || ts.isExpressionStatement(stmt))) {
          simpleValueCount++;
        }
      }
    }

    return simpleValueCount > clauses.length * 0.7;
  }
}