/**
 * Detects dead/unreachable code
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class DeadCodeRule extends BaseRule {
  name = 'dead-code';
  description = 'Detects unreachable/dead code';
  severity = 'warning' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Check for statements after return/throw/break
    context.sourceFile.forEachDescendant((node: any) => {
      const kind = node.getKindName?.() || '';
      
      if (['ReturnStatement', 'ThrowStatement', 'BreakStatement', 'ContinueStatement'].includes(kind)) {
        const nextSibling = node.getNextSibling?.();
        if (nextSibling && this.isExecutableStatement(nextSibling)) {
          findings.push(this.createFinding(
            context,
            'Unreachable code detected after return/throw/break',
            nextSibling,
            'Remove the unreachable code'
          ));
        }
      }
    });

    // Check for empty catch blocks
    const catchClauses = context.sourceFile.getDescendantsOfKind(
      context.sourceFile.getLanguageVariant() === 0 ? 139 : 140 // CatchClause
    );

    for (const catchClause of catchClauses) {
      const body = catchClause.getBody?.();
      if (body) {
        const statements = body.getStatements?.() || [];
        if (statements.length === 0) {
          findings.push(this.createFinding(
            context,
            'Empty catch block detected',
            catchClause,
            'Either handle the error or remove the try-catch'
          ));
        }
      }
    }

    return findings;
  }

  private isExecutableStatement(node: any): boolean {
    const kind = node.getKindName?.() || '';
    return !['EndOfFileToken', 'Whitespace', 'Comment', 'SingleLineComment', 'MultiLineComment'].includes(kind);
  }
}