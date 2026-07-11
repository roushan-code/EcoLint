/**
 * Detects expensive string concatenation patterns
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class ExpensiveStringConcatRule extends BaseRule {
  name = 'expensive-string-concat';
  description = 'Detects inefficient string concatenation';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    const checkNode = (node: ts.Node): void => {
      if (ts.isBinaryExpression(node)) {
        const operator = node.operatorToken.kind;

        // Check for += in loops
        if (operator === ts.SyntaxKind.PlusEqualsToken || operator === ts.SyntaxKind.EqualsToken) {
          const right = node.right;

          if (this.isInLoop(node) && ts.isBinaryExpression(right)) {
            findings.push(this.createFinding(
              context,
              'String concatenation in loop detected - use array join or template literals',
              node,
              'Use StringBuilder pattern or array.join() for better performance'
            ));
          }
        }

        // Check for repeated string concatenation chains
        if (operator === ts.SyntaxKind.PlusToken) {
          const chainLength = this.countConcatChain(node);
          if (chainLength > 5) {
            findings.push(this.createFinding(
              context,
              `Long string concatenation chain (${chainLength} operations) - consider template literals`,
              node,
              'Use template literals or array.join() for better readability and performance'
            ));
          }
        }
      }

      ts.forEachChild(node, checkNode);
    };

    checkNode(context.sourceFile);

    return findings;
  }

  private isInLoop(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isForStatement(parent) || ts.isWhileStatement(parent) ||
          ts.isForInStatement(parent) || ts.isForOfStatement(parent) || ts.isDoStatement(parent)) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  private countConcatChain(node: ts.BinaryExpression): number {
    let count = 0;
    let current: ts.Expression | undefined = node;

    while (current && ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      count++;
      current = current.right;
    }

    return count;
  }
}