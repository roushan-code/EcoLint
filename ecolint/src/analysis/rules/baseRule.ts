/**
 * Base class for analysis rules
 * Extend this class to create new detection rules
 */

import { Rule, RuleContext, Finding } from '../types';

export abstract class BaseRule implements Rule {
  abstract name: string;
  abstract description: string;
  abstract severity: 'error' | 'warning' | 'info';

  abstract detect(context: RuleContext): Finding[];

  protected createFinding(
    context: RuleContext,
    message: string,
    node: any,
    suggestion?: string
  ): Finding {
    const startPos = node.getStart();
    const endPos = node.getEnd();

    return {
      rule: this.name,
      severity: this.severity,
      message,
      file: context.sourceFile.getFilePath(),
      line: context.sourceFile.getLineAndColumnAt(startPos)[0],
      column: context.sourceFile.getLineAndColumnAt(startPos)[1],
      endLine: context.sourceFile.getLineAndColumnAt(endPos)[0],
      endColumn: context.sourceFile.getLineAndColumnAt(endPos)[1],
      code: context.sourceFile.getFullText().slice(startPos, endPos),
      suggestion,
    };
  }
}