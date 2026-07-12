import type { DiffItem, DiffResult, DiffSummary, AcceptRejectResult } from '../types/diff.js';
import { logger } from '../infrastructure/logger.js';

/**
 * Generates a line-by-line diff between original and optimized code
 */
export function generateDiff(originalCode: string, optimizedCode: string): DiffResult {
  const originalLines = originalCode.split('\n');
  const optimizedLines = optimizedCode.split('\n');
  
  const diffs: DiffItem[] = [];
  let summary: DiffSummary = { additions: 0, deletions: 0, modifications: 0 };
  
  // Simple line-by-line diff algorithm
  const maxLines = Math.max(originalLines.length, optimizedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i];
    const optimizedLine = optimizedLines[i];
    
    if (originalLine === undefined) {
      // Addition
      diffs.push({
        lineNumber: i + 1,
        type: 'add',
        newLine: optimizedLine,
      });
      summary.additions++;
    } else if (optimizedLine === undefined) {
      // Deletion
      diffs.push({
        lineNumber: i + 1,
        type: 'remove',
        originalLine: originalLine,
      });
      summary.deletions++;
    } else if (originalLine !== optimizedLine) {
      // Modification
      diffs.push({
        lineNumber: i + 1,
        type: 'modify',
        originalLine: originalLine,
        newLine: optimizedLine,
      });
      summary.modifications++;
    }
  }
  
  logger.info('Diff generated', { 
    additions: summary.additions, 
    deletions: summary.deletions, 
    modifications: summary.modifications 
  });
  
  return {
    originalCode,
    optimizedCode,
    diffs,
    summary,
  };
}

/**
 * Applies accepted changes to the code
 */
export function applyChanges(
  originalCode: string, 
  optimizedCode: string, 
  diffIndices?: number[]
): AcceptRejectResult {
  const originalLines = originalCode.split('\n');
  const optimizedLines = optimizedCode.split('\n');
  
  const result = [...originalLines];
  let appliedChanges = 0;
  
  const diffs = generateDiff(originalCode, optimizedCode);
  
  for (let i = 0; i < diffs.diffs.length; i++) {
    const diff = diffs.diffs[i];
    
    // Skip if diff is undefined
    if (!diff) {
      continue;
    }
    
    // If specific indices provided, only apply those
    if (diffIndices && !diffIndices.includes(i)) {
      continue;
    }
    
    if (diff.type === 'add' && diff.newLine !== undefined) {
      result.splice(diff.lineNumber - 1 + appliedChanges, 0, diff.newLine);
      appliedChanges++;
    } else if (diff.type === 'remove') {
      result.splice(diff.lineNumber - 1 - appliedChanges, 1);
      appliedChanges--;
    } else if (diff.type === 'modify' && diff.newLine !== undefined) {
      result[diff.lineNumber - 1] = diff.newLine;
      appliedChanges++;
    }
  }
  
  logger.info('Changes applied', { appliedChanges });
  
  return {
    success: true,
    code: result.join('\n'),
    appliedChanges: Math.abs(appliedChanges),
    message: `Successfully applied ${appliedChanges} changes`,
  };
}

/**
 * Reverts to original code (rejects all changes)
 */
export function revertChanges(): AcceptRejectResult {
  return {
    success: true,
    code: '',
    appliedChanges: 0,
    message: 'Changes rejected - use original code',
  };
}

/**
 * Accept all changes - returns optimized code
 */
export function acceptAll(originalCode: string, optimizedCode: string): AcceptRejectResult {
  const diffs = generateDiff(originalCode, optimizedCode);
  
  return {
    success: true,
    code: optimizedCode,
    appliedChanges: diffs.summary.additions + diffs.summary.deletions + diffs.summary.modifications,
    message: `Accepted all ${diffs.diffs.length} changes`,
  };
}

/**
 * Reject all changes - returns original code
 */
export function rejectAll(originalCode: string): AcceptRejectResult {
  return {
    success: true,
    code: originalCode,
    appliedChanges: 0,
    message: 'All changes rejected',
  };
}

export const diffService = {
  generateDiff,
  applyChanges,
  revertChanges,
  acceptAll,
  rejectAll,
};