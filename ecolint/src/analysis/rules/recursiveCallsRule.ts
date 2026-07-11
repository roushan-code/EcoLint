/**
 * Detects recursive function calls
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class RecursiveCallsRule extends BaseRule {
  name = 'recursive-calls';
  description = 'Detects recursive function calls';
  severity = 'info' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Get all function declarations
    const functions = context.sourceFile.getDescendantsOfKind(
      context.sourceFile.getLanguageVariant() === 0 ? 193 : 194 // FunctionDeclaration/ArrowFunction
    );

    for (const func of functions) {
      const funcName = func.getName?.() || this.getAnonymousFunctionDescription(func, context.sourceFile);
      
      // Check if function calls itself
      if (this.hasDirectRecursion(func, funcName)) {
        findings.push(this.createFinding(
          context,
          `Direct recursion detected in function '${funcName}'`,
          func,
          'Consider converting to iterative approach or adding memoization for performance'
        ));
      }

      // Check for mutual/tail recursion
      const indirectRecursion = this.hasIndirectRecursion(func, funcName, new Set());
      if (indirectRecursion) {
        findings.push(this.createFinding(
          context,
          `Indirect recursion detected involving '${funcName}'`,
          func,
          'Review the call chain to ensure it terminates correctly'
        ));
      }
    }

    return findings;
  }

  private getAnonymousFunctionDescription(node: any, sourceFile: any): string {
    const start = node.getStart?.() || 0;
    const lineInfo = sourceFile?.getLineAndColumnAt?.(start);
    return `anonymous at line ${lineInfo?.[0] || 'unknown'}`;
  }

  private hasDirectRecursion(func: any, funcName: string): boolean {
    if (!funcName || funcName.startsWith('anonymous')) {
      return false;
    }

    const body = func.getBody?.();
    if (!body) {
      return false;
    }

    const bodyText = body.getFullText?.() || '';
    // Check if function body contains a call to itself
    const pattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    return pattern.test(bodyText);
  }

  private hasIndirectRecursion(func: any, funcName: string, visited: Set<string>): boolean {
    if (!funcName || funcName.startsWith('anonymous') || visited.has(funcName)) {
      return false;
    }

    visited.add(funcName);
    const body = func.getBody?.();
    if (!body) {
      return false;
    }

    // Find all function calls in the body
    const calls = body.getDescendantsOfKind?.(211) || []; // CallExpression kind
    for (const call of calls) {
      const calledFunc = call.getExpression?.()?.getText?.();
      if (calledFunc && calledFunc !== funcName) {
        // Check if this function exists and is being called back
        if (visited.has(calledFunc)) {
          return true;
        }
      }
    }

    return false;
  }
}