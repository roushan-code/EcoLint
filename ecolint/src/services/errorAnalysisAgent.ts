/**
 * Error Analysis Agent
 * 
 * Analyzes validation errors and provides context-aware suggestions
 * for the Optimization Agent to retry with better context.
 */

import type { ValidationResult, ValidationError } from '../types/validation.js';
import type { ErrorAnalysis, ErrorDescription } from '../types/orchestrator.js';
import { Logger } from '../infrastructure/logger.js';

export class ErrorAnalysisAgent {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Analyze validation errors and generate actionable insights
   */
  public analyze(validationResult: ValidationResult): ErrorAnalysis {
    this.logger.info('Analyzing validation errors...');

    const errors = this.parseErrors(validationResult);
    const rootCauses = this.identifyRootCauses(errors);
    const suggestedFixes = this.generateSuggestedFixes(errors, rootCauses);
    const summary = this.generateSummary(errors, rootCauses);

    return {
      summary,
      errors,
      rootCauses,
      suggestedFixes,
    };
  }

  /**
   * Parse validation errors into structured format
   */
  private parseErrors(validationResult: ValidationResult): ErrorDescription[] {
    const errors: ErrorDescription[] = [];

    // Parse errors from all validation checks
    for (const check of validationResult.checks) {
      for (const error of check.errors) {
        errors.push({
          type: error.type,
          message: error.message,
          file: error.file,
          line: error.line,
          column: error.column,
          explanation: this.explainError(error),
        });
      }
    }

    return errors;
  }

  /**
   * Identify root causes from errors
   */
  private identifyRootCauses(errors: ErrorDescription[]): string[] {
    const rootCauses: Set<string> = new Set();

    for (const error of errors) {
      switch (error.type) {
        case 'compilation':
          if (error.message.includes('undefined')) {
            rootCauses.add('Variable or function is not defined');
          } else if (error.message.includes('type')) {
            rootCauses.add('Type mismatch or incorrect type annotation');
          } else if (error.message.includes('syntax')) {
            rootCauses.add('Syntax error in generated code');
          } else {
            rootCauses.add('Compilation error in optimized code');
          }
          break;

        case 'linting':
          if (error.message.includes('unused')) {
            rootCauses.add('Unused variables or imports introduced');
          } else if (error.message.includes('naming')) {
            rootCauses.add('Variable naming convention violation');
          } else {
            rootCauses.add('Code style or quality issue');
          }
          break;

        case 'test':
          if (error.message.includes('expected')) {
            rootCauses.add('Optimization changed expected behavior');
          } else if (error.message.includes('timeout')) {
            rootCauses.add('Performance regression causing timeout');
          } else {
            rootCauses.add('Test failure in optimized code');
          }
          break;

        case 'runtime':
          rootCauses.add('Runtime error in optimized code');
          break;
      }
    }

    return Array.from(rootCauses);
  }

  /**
   * Generate suggested fixes based on errors and root causes
   */
  private generateSuggestedFixes(_errors: ErrorDescription[], rootCauses: string[]): string[] {
    const fixes: string[] = [];

    for (const rootCause of rootCauses) {
      switch (rootCause) {
        case 'Variable or function is not defined':
          fixes.push('Ensure all variable declarations are preserved during optimization');
          fixes.push('Check that function references are not accidentally removed');
          break;

        case 'Type mismatch or incorrect type annotation':
          fixes.push('Preserve original type annotations');
          fixes.push('Avoid changing variable types during optimization');
          break;

        case 'Syntax error in generated code':
          fixes.push('Review generated code for proper syntax');
          fixes.push('Ensure balanced braces and parentheses');
          break;

        case 'Unused variables or imports introduced':
          fixes.push('Remove unused variables and imports from optimized code');
          fixes.push('Use strict mode to catch unused declarations');
          break;

        case 'Optimization changed expected behavior':
          fixes.push('Ensure semantic equivalence with original code');
          fixes.push('Preserve side effects and return values');
          break;

        case 'Performance regression causing timeout':
          fixes.push('Avoid introducing O(n²) or worse complexity');
          fixes.push('Use efficient data structures');
          break;

        case 'Runtime error in optimized code':
          fixes.push('Check for null/undefined access issues');
          fixes.push('Ensure proper error handling is preserved');
          break;
      }
    }

    return [...new Set(fixes)]; // Remove duplicates
  }

  /**
   * Generate a summary of the error analysis
   */
  private generateSummary(errors: ErrorDescription[], rootCauses: string[]): string {
    const errorCount = errors.length;
    const uniqueTypes = [...new Set(errors.map((e) => e.type))];

    let summary = `Found ${errorCount} error${errorCount !== 1 ? 's' : ''} `;
    summary += `of type${uniqueTypes.length !== 1 ? 's' : ''}: ${uniqueTypes.join(', ')}. `;

    if (rootCauses.length > 0) {
      summary += `Root cause${rootCauses.length !== 1 ? 's' : ''} identified: ${rootCauses.join('; ')}.`;
    }

    return summary;
  }

  /**
   * Explain an error based on its type and message
   */
  private explainError(error: ValidationError): string {
    switch (error.type) {
      case 'compilation':
        if (error.message.includes('Cannot find name')) {
          return 'A variable or function was used that was not defined in scope.';
        }
        if (error.message.includes('Property does not exist')) {
          return 'Accessing a property that does not exist on the type.';
        }
        if (error.message.includes('Argument of type')) {
          return 'Passed an argument of incorrect type to a function.';
        }
        return 'The code failed to compile. Check syntax and type correctness.';

      case 'linting':
        if (error.message.includes('unused')) {
          return 'A variable or import was declared but never used.';
        }
        if (error.message.includes('no-undef')) {
          return 'A variable was used without being declared.';
        }
        return 'The code violates a linting rule. Review the style guidelines.';

      case 'test':
        if (error.message.includes('expected')) {
          return 'The optimized code produced different output than expected.';
        }
        if (error.message.includes('toBe')) {
          return 'A value comparison failed. The optimization may have changed behavior.';
        }
        return 'A test case failed. The optimization may have broken expected functionality.';

      case 'runtime':
        return 'A runtime error occurred. Check for null/undefined access or logic errors.';

      default:
        return 'An error occurred during validation.';
    }
  }
}