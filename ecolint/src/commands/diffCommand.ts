import { 
  window, 
  commands, 
  Range, 
  Position, 
  InlineCompletionItem, 
  InlineCompletionContext,
  InlineCompletionItemProvider,
  TextDocument,
  ProviderResult,
  languages,
  DecorationOptions,
  TextEditorDecorationType
} from 'vscode';
import { ApiService } from '../services/apiService.js';
import { Logger } from '../infrastructure/logger.js';
import type { DiffResult, DiffItem } from '../types/diff.js';

let currentDiffData: DiffResult | null = null;
let currentOptimizedCode: string = '';
let diffProvider: DiffInlineCompletionProvider | null = null;
let decorationDisposables: TextEditorDecorationType[] = [];

const apiService = new ApiService(new Logger());

export async function showDiffCommand(
  originalCode: string,
  optimizedCode: string,
  _fileName: string
): Promise<void> {
  try {
    currentOptimizedCode = optimizedCode;

    // Call backend to generate diff
    const response = await apiService.generateDiff(originalCode, optimizedCode);

    if (!response.success || !response.data) {
      window.showErrorMessage(`Failed to generate diff: ${response.error}`);
      return;
    }

    currentDiffData = response.data as DiffResult;

    // Show inline suggestions with decorations
    await showInlineSuggestions(currentDiffData);

  } catch (error) {
    window.showErrorMessage(`Error showing diff: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Show inline suggestions like GitHub Copilot with green/red/yellow highlighting
 */
async function showInlineSuggestions(diffData: DiffResult): Promise<void> {
  const editor = window.activeTextEditor;
  if (!editor) {
    window.showErrorMessage('No active editor found');
    return;
  }

  // Dispose previous provider if exists
  if (diffProvider) {
    diffProvider.dispose();
    diffProvider = null;
  }

  // Clear previous decorations
  clearDecorations();

  // Create new provider with the diff data
  diffProvider = new DiffInlineCompletionProvider(diffData, currentOptimizedCode);
  
  // Register the provider for all languages
  const disposable = languages.registerInlineCompletionItemProvider(
    { pattern: '*' },
    diffProvider
  );

  // Store disposable for cleanup
  diffProvider.disposables.push(disposable);

  // Show inline decorations with colors
  await showDiffDecorations();

  // Show a notification with instructions
  window.showInformationMessage(
    'EcoLint: Inline suggestions ready! Use Tab to accept, or click Accept/Reject buttons.',
    'Accept All',
    'Reject All'
  ).then(selection => {
    if (selection === 'Accept All') {
      acceptAllChanges();
    } else if (selection === 'Reject All') {
      rejectAllChanges();
    }
  });

  // Register keyboard shortcuts
  registerDiffCommands();
}

class DiffInlineCompletionProvider implements InlineCompletionItemProvider {
  private optimizedCode: string;
  public disposables: any[] = [];

  constructor(_diffData: DiffResult, optimizedCode: string) {
    this.optimizedCode = optimizedCode;
  }

  provideInlineCompletionItems(
    _document: TextDocument,
    position: Position,
    _context: InlineCompletionContext,
    _token: any
  ): ProviderResult<InlineCompletionItem[] | { items: InlineCompletionItem[] }> {
    // Only show suggestions if we're at the start of the document
    if (position.line > 0 || position.character > 0) {
      return [];
    }

    // Create inline completion with the optimized code
    const completion = new InlineCompletionItem(
      this.optimizedCode,
      new Range(new Position(0, 0), new Position(0, 0)),
      {
        title: 'Accept EcoLint Suggestion',
        command: 'ecolint.acceptAllChanges'
      }
    );

    return [completion];
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

function registerDiffCommands(): void {
  // Register Accept All command
  commands.registerCommand('ecolint.acceptAllChanges', async () => {
    await acceptAllChanges();
  });

  // Register Reject All command
  commands.registerCommand('ecolint.rejectAllChanges', async () => {
    await rejectAllChanges();
  });
}

async function acceptAllChanges(): Promise<void> {
  const editor = window.activeTextEditor;
  if (!editor || !currentOptimizedCode) {
    return;
  }

  try {
    // Replace entire document with optimized code
    const fullRange = new Range(
      new Position(0, 0),
      new Position(editor.document.lineCount, editor.document.lineAt(editor.document.lineCount - 1).text.length)
    );

    await editor.edit(editBuilder => {
      editBuilder.replace(fullRange, currentOptimizedCode);
    });

    // Clean up
    clearDecorations();
    if (diffProvider) {
      diffProvider.dispose();
      diffProvider = null;
    }

    window.showInformationMessage('EcoLint: All changes accepted!');
  } catch (error) {
    window.showErrorMessage(`Failed to apply changes: ${error}`);
  }
}

async function rejectAllChanges(): Promise<void> {
  // Clean up
  clearDecorations();
  if (diffProvider) {
    diffProvider.dispose();
    diffProvider = null;
  }

  currentDiffData = null;
  currentOptimizedCode = '';

  window.showInformationMessage('EcoLint: All changes rejected!');
}

/**
 * Show diff with syntax-highlighted inline decorations (green/red/yellow)
 */
async function showDiffDecorations(): Promise<void> {
  if (!currentDiffData) {
    return;
  }

  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }

  const diffData = currentDiffData;

  // Create decoration types with explicit colors (not ThemeColor for better compatibility)
  const addDecorationType = window.createTextEditorDecorationType({
    isWholeLine: false,
    backgroundColor: 'rgba(78, 201, 176, 0.2)',  // Green for additions
    borderColor: '#4ec9b0',
    borderWidth: '0 0 0 3px',
    overviewRulerColor: '#4ec9b0',
    overviewRulerLane: 1,
    after: {
      contentText: ' ➕',
      color: '#4ec9b0',
      fontWeight: 'bold'
    }
  });

  const removeDecorationType = window.createTextEditorDecorationType({
    isWholeLine: false,
    backgroundColor: 'rgba(241, 76, 76, 0.2)',  // Red for deletions
    borderColor: '#f14c4c',
    borderWidth: '0 0 0 3px',
    overviewRulerColor: '#f14c4c',
    overviewRulerLane: 1,
    textDecoration: 'line-through',
    after: {
      contentText: ' ✂️',
      color: '#f14c4c',
      fontWeight: 'bold'
    }
  });

  const modifyDecorationType = window.createTextEditorDecorationType({
    isWholeLine: false,
    backgroundColor: 'rgba(220, 220, 170, 0.2)',  // Yellow for modifications
    borderColor: '#dcdcaa',
    borderWidth: '0 0 0 3px',
    overviewRulerColor: '#dcdcaa',
    overviewRulerLane: 1,
    after: {
      contentText: ' 🔄',
      color: '#dcdcaa',
      fontWeight: 'bold'
    }
  });

  decorationDisposables = [addDecorationType, removeDecorationType, modifyDecorationType];

  // Build decoration options
  const addDecorations: DecorationOptions[] = [];
  const removeDecorations: DecorationOptions[] = [];
  const modifyDecorations: DecorationOptions[] = [];

  for (const diff of diffData.diffs) {
    const lineNumber = diff.lineNumber - 1;
    if (lineNumber < 0 || lineNumber >= editor.document.lineCount) {
      continue;
    }
    const lineLength = editor.document.lineAt(lineNumber).text.length;
    const range = new Range(lineNumber, 0, lineNumber, lineLength);

    const hoverMessage = getHoverMessage(diff);

    if (diff.type === 'add') {
      addDecorations.push({ range, hoverMessage });
    } else if (diff.type === 'remove') {
      removeDecorations.push({ range, hoverMessage });
    } else if (diff.type === 'modify') {
      modifyDecorations.push({ range, hoverMessage });
    }
  }

  // Apply decorations
  editor.setDecorations(addDecorationType, addDecorations);
  editor.setDecorations(removeDecorationType, removeDecorations);
  editor.setDecorations(modifyDecorationType, modifyDecorations);

  // Show status bar
  window.setStatusBarMessage(
    `EcoLint: ${diffData.summary.additions} additions (🟢 green), ${diffData.summary.deletions} deletions (🔴 red), ${diffData.summary.modifications} modifications (🟡 yellow) | Run "Accept All" or "Reject All"`,
    15000
  );
}

function clearDecorations(): void {
  for (const decoration of decorationDisposables) {
    decoration.dispose();
  }
  decorationDisposables = [];
}

function getHoverMessage(diff: DiffItem): string {
  if (diff.explanation) {
    return `💡 ${diff.explanation}`;
  }

  switch (diff.type) {
    case 'add':
      return `➕ Added line:\n${diff.newLine || ''}`;
    case 'remove':
      return `✂️ Removed line:\n${diff.originalLine || ''}`;
    case 'modify':
      return `🔄 Modified:\n- ${diff.originalLine || ''}\n+ ${diff.newLine || ''}`;
    default:
      return 'EcoLint change';
  }
}