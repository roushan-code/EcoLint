export interface DiffItem {
    lineNumber: number;
    type: 'add' | 'remove' | 'modify';
    originalLine?: string;
    newLine?: string;
}
export interface DiffSummary {
    additions: number;
    deletions: number;
    modifications: number;
}
export interface DiffResult {
    originalCode: string;
    optimizedCode: string;
    diffs: DiffItem[];
    summary: DiffSummary;
}
export interface AcceptRejectRequest {
    originalCode: string;
    optimizedCode: string;
    action: 'accept' | 'reject';
    diffIndex?: number;
}
export interface AcceptRejectResult {
    success: boolean;
    code: string;
    appliedChanges: number;
    message: string;
}
//# sourceMappingURL=diff.d.ts.map