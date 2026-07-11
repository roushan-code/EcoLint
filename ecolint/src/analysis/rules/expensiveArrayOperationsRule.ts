/**
 * Detects expensive array operations (nested loops over arrays, repeated filter/map/reduce)
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class ExpensiveArrayOperationsRule extends BaseRule {
  name = 'expensive-array-operations';
  description = 'Detects expensive array operations';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    const checkNode = (node: ts.Node, parentIsArrayMethod: boolean = false): void => {
      // Check for nested array methods (map/filter/reduce inside map/filter/reduce)
      if (this.isArrayMethodCall(node)) {
        if (parentIsArrayMethod) {
          findings.push(this.createFinding(
            context,
            'Nested array method detected - consider using a single pass or different data structure',
            node,
            'Combine operations or use a single loop for better performance'
          ));
        }
        // Check children with parentIsArrayMethod = true
        ts.forEachChild(node, (child) => checkNode(child, true));
      } else {
        ts.forEachChild(node, (child) => checkNode(child, parentIsArrayMethod));
      }
    };

    checkNode(context.sourceFile);

    return findings;
  }

  private isArrayMethodCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    const expr = node.expression;
    if (!ts.isPropertyAccessExpression(expr)) return false;
    const methodName = expr.name.text;
    return ['map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every'].includes(methodName);
  }
}