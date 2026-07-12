import fs from 'fs/promises';

export interface ExtractedSnippet {
  fullContent: string;
  extractedSnippet: string;
  startLine: number;
  endLine: number;
}

export async function readFileSnippet(filePath: string, lineRange?: string): Promise<ExtractedSnippet> {
  let content = '';
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : error}`);
  }

  if (!lineRange) {
    return {
      fullContent: content,
      extractedSnippet: content,
      startLine: 1,
      endLine: content.split('\n').length
    };
  }

  const [startStr, endStr] = lineRange.split('-');
  const startLine = parseInt(startStr, 10);
  const endLine = parseInt(endStr, 10);

  if (isNaN(startLine) || isNaN(endLine) || startLine > endLine || startLine < 1) {
    throw new Error(`Invalid line range: ${lineRange}. Expected format start-end (e.g., 12-35).`);
  }

  const lines = content.split('\n');
  if (endLine > lines.length) {
    throw new Error(`Line range ${lineRange} exceeds file length (${lines.length} lines).`);
  }

  // 1-based to 0-based index
  const extractedSnippet = lines.slice(startLine - 1, endLine).join('\n');

  return {
    fullContent: content,
    extractedSnippet,
    startLine,
    endLine
  };
}
