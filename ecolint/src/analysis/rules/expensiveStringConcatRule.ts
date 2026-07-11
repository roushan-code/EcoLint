/**
 * Detects expensive string concatenation patterns
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class ExpensiveStringConcatRule extends BaseRule {
  name = 'expensive-string-concat';
  description = 'Detects inefficient string concatenation';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    context.sourceFile.forEachDescendant((node: any) => {
      const kind = node.getKindName?.() || '';

      // Check for += in loops
      if (kind === 'BinaryExpression') {
        const operator = node.getOperatorToken?.()?.getText?.();
        if (operator === '+=' || operator === '=') {
          const left = node.getLeft?.();
          const right = node.getRight?.();
          
          if (left && right) {
            const leftText = left.getText?.() || '';
            const rightText = right.getText?.() || '';
            
            // Check if it's string concatenation in a loop
            if (this.isInLoop(node) && (leftText.includes('+') || rightText.includes('+'))) {
              findings.push(this.createFinding(
                context,
                'String concatenation in loop detected - use array join or template literals',
                node,
                'Use StringBuilder pattern or array.join() for better performance'
              ));
            }
          }
        }
      }

      // Check for repeated string concatenation chains
      if (kind === 'BinaryExpression') {
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
    });

    return findings;
  }

  private isInLoop(node: any): boolean {
    let parent = node.getParent?.();
    while (parent) {
      const kind = parent.getKindName?.() || '';
      if (['ForStatement', 'WhileStatement', 'ForInStatement', 'ForOfStatement', 'DoStatement'].includes(kind)) {
        return true;
      }
      parent = parent.getParent?.();
    }
    return false;
  }

  private countConcatChain(node: any): number {
    let count = 0;
    let current: any = node;
    
    while (current) {
      const kind = current.getKindName?.() || '';
      if (kind === 'BinaryExpression') {
        const op = current.getOperatorToken?.()?.getText?.();
        if (op === '+') {
          count++;
          const right = current.getRight?.();
          if (right) {
            current = right.getKindName?.() === 'BinaryExpression' ? right : null;
          } else {
            current = null;
          }
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return count;
  }
}