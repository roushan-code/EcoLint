/**
 * Detects expensive array operations (nested loops over arrays, repeated filter/map/reduce)
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class ExpensiveArrayOperationsRule extends BaseRule {
  name = 'expensive-array-operations';
  description = 'Detects expensive array operations';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    context.sourceFile.forEachDescendant((node: any) => {
      const kind = node.getKindName?.() || '';

      // Check for nested array methods (map/filter/reduce inside map/filter/reduce)
      if (this.isArrayMethod(kind)) {
        const parent = node.getParent?.();
        if (parent && this.isArrayMethod(parent.getKindName?.() || '')) {
          findings.push(this.createFinding(
            context,
            'Nested array method detected - consider using a single pass or different data structure',
            node,
            'Combine operations or use a single loop for better performance'
          ));
        }
      }

      // Check for loops over large arrays without index caching
      if (this.isLoopKind(kind)) {
        const body = node.getBody?.();
        if (body) {
          const arrayAccesses = this.countArrayIndexAccesses(body);
          if (arrayAccesses > 3) {
            findings.push(this.createFinding(
              context,
              `Loop with ${arrayAccesses} array index accesses detected - consider caching array length`,
              node,
              'Cache array length in a variable to avoid repeated property lookups'
            ));
          }
        }
      }
    });

    return findings;
  }

  private isArrayMethod(kind: string): boolean {
    return ['CallExpression'].some(m => kind.includes(m)) && 
           ['map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every'].some(m => kind.toLowerCase().includes(m));
  }

  private isLoopKind(kind: string): boolean {
    return ['ForStatement', 'WhileStatement', 'ForInStatement', 'ForOfStatement'].includes(kind);
  }

  private countArrayIndexAccesses(node: any): number {
    let count = 0;
    const text = node.getFullText?.() || '';
    
    // Count patterns like array[i] or array.length
    const indexPattern = /\w+\[[^\]]+\]/g;
    const lengthPattern = /\w+\.length/g;
    
    count += (text.match(indexPattern) || []).length;
    count += (text.match(lengthPattern) || []).length;
    
    return count;
  }
}