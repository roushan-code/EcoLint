/**
 * Detects recursive function calls
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class RecursiveCallsRule extends BaseRule {
  name = 'recursive-calls';
  description = 'Detects recursive function calls';
  severity = 'info' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    const findFunctions = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const funcName = node.name?.text || this.getAnonymousFunctionDescription(node, context);

        // Check if function calls itself
        if (this.hasDirectRecursion(node, funcName)) {
          findings.push(this.createFinding(
            context,
            `Direct recursion detected in function '${funcName}'`,
            node,
            'Consider converting to iterative approach or adding memoization for performance'
          ));
        }
      }

      ts.forEachChild(node, findFunctions);
    };

    findFunctions(context.sourceFile);

    return findings;
  }

  private getAnonymousFunctionDescription(node: ts.FunctionDeclaration | ts.ArrowFunction, context: RuleContext): string {
    const start = node.getStart();
    const lineInfo = context.sourceFile.getLineAndCharacterOfPosition(start);
    return `anonymous at line ${lineInfo.line + 1}`;
  }

  private hasDirectRecursion(func: ts.FunctionDeclaration | ts.ArrowFunction, funcName: string): boolean {
    if (!funcName || funcName.startsWith('anonymous')) {
      return false;
    }

    const body = func.body;
    if (!body) {
      return false;
    }

    const bodyText = body.getFullText();
    // Check if function body contains a call to itself
    const pattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
    return pattern.test(bodyText);
  }
}