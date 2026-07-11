/**
 * Base class for analysis rules
 * Extend this class to create new detection rules
 */

import * as ts from 'typescript';
import { Rule, RuleContext, Finding } from '../types';

export abstract class BaseRule implements Rule {
  abstract name: string;
  abstract description: string;
  abstract severity: 'error' | 'warning' | 'info';

  abstract detect(context: RuleContext): Finding[];

  protected createFinding(
    context: RuleContext,
    message: string,
    node: ts.Node,
    suggestion?: string
  ): Finding {
    const startPos = node.getStart();
    const endPos = node.getEnd();
    const startLine = context.sourceFile.getLineAndCharacterOfPosition(startPos);
    const endLine = context.sourceFile.getLineAndCharacterOfPosition(endPos);

    return {
      rule: this.name,
      severity: this.severity,
      message,
      file: context.sourceFile.fileName,
      line: startLine.line + 1,
      column: startLine.character + 1,
      endLine: endLine.line + 1,
      endColumn: endLine.character + 1,
      code: context.sourceFile.getFullText().slice(startPos, endPos),
      suggestion,
    };
  }
}