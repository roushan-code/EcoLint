/**
 * Detects long functions
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class LongFunctionsRule extends BaseRule {
  name = 'long-function';
  description = 'Detects functions that are too long';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxLines = context.config.maxFunctionLines ?? 50;

    const findFunctions = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const name = node.name?.text || 'anonymous';
        const startLine = context.sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const endLine = context.sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        const lineCount = endLine - startLine + 1;

        if (lineCount > maxLines) {
          findings.push(this.createFinding(
            context,
            `Function '${name}' has ${lineCount} lines (max: ${maxLines})`,
            node,
            'Consider breaking this function into smaller, more focused functions'
          ));
        }
      }
      ts.forEachChild(node, findFunctions);
    };

    findFunctions(context.sourceFile);

    return findings;
  }
}