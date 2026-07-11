/**
 * Detects unused variables
 */

import * as ts from 'typescript';
import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class UnusedVariablesRule extends BaseRule {
  name = 'unused-variables';
  description = 'Detects unused variables and parameters';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const sourceText = context.sourceFile.getFullText();

    const findVariables = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && node.name.kind === ts.SyntaxKind.Identifier) {
        const name = node.name.text;
        if (!this.isUsed(name, sourceText)) {
          findings.push(this.createFinding(
            context,
            `Unused variable '${name}'`,
            node,
            `Remove or use the variable '${name}'`
          ));
        }
      }
      ts.forEachChild(node, findVariables);
    };

    findVariables(context.sourceFile);

    return findings;
  }

  private isUsed(name: string, sourceText: string): boolean {
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    const matches = sourceText.match(regex);
    return matches ? matches.length > 1 : false;
  }
}