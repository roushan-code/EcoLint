/**
 * Detects unused variables
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class UnusedVariablesRule extends BaseRule {
  name = 'unused-variables';
  description = 'Detects unused variables and parameters';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Check for unused variables
    const variableDeclarations = context.sourceFile.getDescendantsOfKind(
      context.sourceFile.getLanguageVariant() === 0 ? 268 : 269 // VariableDeclaration
    );

    for (const decl of variableDeclarations) {
      const name = decl.getName?.();
      if (name && !this.isUsed(name, context.sourceFile)) {
        findings.push(this.createFinding(
          context,
          `Unused variable '${name}'`,
          decl,
          `Remove or use the variable '${name}'`
        ));
      }
    }

    // Check for unused function parameters
    const functions = context.sourceFile.getDescendantsOfKind(
      context.sourceFile.getLanguageVariant() === 0 ? 193 : 194
    );

    for (const func of functions) {
      const params = func.getParameters?.() || [];
      const body = func.getBody?.();
      const bodyText = body?.getFullText?.() || '';

      for (const param of params) {
        const paramName = param.getName?.();
        if (paramName && !this.isUsedInText(paramName, bodyText)) {
          findings.push(this.createFinding(
            context,
            `Unused parameter '${paramName}'`,
            param,
            `Remove the unused parameter or use it in the function body`
          ));
        }
      }
    }

    return findings;
  }

  private isUsed(name: string, sourceFile: any): boolean {
    const text = sourceFile.getFullText();
    return this.isUsedInText(name, text);
  }

  private isUsedInText(name: string, text: string): boolean {
    // Simple check - count occurrences (should be > 1 for usage)
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    const matches = text.match(regex);
    return matches ? matches.length > 1 : false;
  }
}