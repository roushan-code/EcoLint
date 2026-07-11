/**
 * Detects long functions
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class LongFunctionsRule extends BaseRule {
  name = 'long-function';
  description = 'Detects functions that are too long';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxLines = context.config.maxFunctionLines ?? 50;

    const functions = context.sourceFile.getDescendantsOfKind(
      context.sourceFile.getLanguageVariant() === 0 ? 193 : 194 // FunctionDeclaration/ArrowFunction
    );

    for (const func of functions) {
      const name = func.getName?.() || 'anonymous';
      const startLine = func.getStart?.() ? context.sourceFile.getLineAndColumnAt(func.getStart())[0] : 0;
      const endLine = func.getEnd?.() ? context.sourceFile.getLineAndColumnAt(func.getEnd())[0] : 0;
      const lineCount = endLine - startLine + 1;

      if (lineCount > maxLines) {
        findings.push(this.createFinding(
          context,
          `Function '${name}' has ${lineCount} lines (max: ${maxLines})`,
          func,
          'Consider breaking this function into smaller, more focused functions'
        ));
      }
    }

    return findings;
  }
}