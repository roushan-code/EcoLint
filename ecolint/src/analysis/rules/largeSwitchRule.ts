/**
 * Detects large switch statements
 */

import { BaseRule } from './baseRule';
import { RuleContext, Finding } from '../types';

export class LargeSwitchRule extends BaseRule {
  name = 'large-switch';
  description = 'Detects large switch statements';
  severity = 'info' as const;

  detect(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const maxCases = context.config.maxSwitchCases ?? 10;

    context.sourceFile.forEachDescendant((node: any) => {
      const kind = node.getKindName?.();

      if (kind === 'SwitchStatement') {
        const cases = this.getSwitchCases(node);
        
        if (cases.length > maxCases) {
          findings.push(this.createFinding(
            context,
            `Switch statement has ${cases.length} cases (max: ${maxCases})`,
            node,
            'Consider using a lookup object/map or polymorphism for better maintainability'
          ));
        }

        // Check for switch statements that could be replaced with objects
        if (cases.length > 3 && this.couldBeObjectPattern(node)) {
          findings.push(this.createFinding(
            context,
            'Switch statement could potentially be replaced with a lookup object',
            node,
            'Consider using a Map or object for O(1) lookup instead of O(n)'
          ));
        }
      }
    });

    return findings;
  }

  private getSwitchCases(node: any): any[] {
    const cases: any[] = [];
    const clauses = node.getClauses?.() || node.getCaseBlock?.()?.getCases?.() || [];
    
    for (const clause of clauses) {
      if (clause.getKindName?.() === 'CaseClause') {
        cases.push(clause);
      }
    }
    
    return cases;
  }

  private couldBeObjectPattern(node: any): boolean {
    // Check if all cases return/assign simple values
    const cases = this.getSwitchCases(node);
    let simpleValueCount = 0;

    for (const caseNode of cases) {
      const statements = caseNode.getStatements?.() || [];
      if (statements.length === 1) {
        const stmt = statements[0];
        const kind = stmt.getKindName?.();
        if (kind === 'ReturnStatement' || kind === 'ExpressionStatement') {
          simpleValueCount++;
        }
      }
    }

    return simpleValueCount > cases.length * 0.7;
  }
}