import * as path from 'path';
import * as vscode from 'vscode';
import type { FileRef } from './types';

const FILE_EXCLUDE =
  '**/{node_modules,.git,dist,out,.venv,__pycache__,.pytest_cache,.ruff_cache,*.lock}/**';

const PER_FILE_BYTE_CAP = 100_000;  // 100 KB per file
const TOTAL_BYTE_CAP = 400_000;     // 400 KB total context

/**
 * Return a list of all workspace files, excluding noisy directories.
 * Sorted alphabetically by relative path.
 */
export async function listWorkspaceFiles(): Promise<FileRef[]> {
  const uris = await vscode.workspace.findFiles('**/*', FILE_EXCLUDE, 2000);
  const refs: FileRef[] = uris.map((uri) => ({
    path: vscode.workspace.asRelativePath(uri, false),
    name: path.basename(uri.fsPath),
  }));
  refs.sort((a, b) => a.path.localeCompare(b.path));
  return refs;
}

/**
 * Read the given workspace-relative paths and return a single formatted
 * context string suitable for prepending to a model prompt.
 *
 * Each file is fenced with its path as a header. Files that exceed
 * PER_FILE_BYTE_CAP are truncated with a marker. Once TOTAL_BYTE_CAP is
 * reached, remaining files are noted but not included.
 */
export async function readAttachments(relativePaths: string[]): Promise<string> {
  if (relativePaths.length === 0) {
    return '';
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return '';
  }

  const parts: string[] = [];
  let totalBytes = 0;

  for (const relPath of relativePaths) {
    if (totalBytes >= TOTAL_BYTE_CAP) {
      parts.push(`\n<!-- Additional attached file omitted (total context limit reached): ${relPath} -->`);
      continue;
    }

    const uri = vscode.Uri.joinPath(workspaceFolder.uri, relPath);

    let raw: Uint8Array;
    try {
      raw = await vscode.workspace.fs.readFile(uri);
    } catch {
      parts.push(`\n<!-- Could not read file: ${relPath} -->`);
      continue;
    }

    let content = new TextDecoder().decode(raw);
    let truncated = false;

    if (raw.byteLength > PER_FILE_BYTE_CAP) {
      // Truncate to PER_FILE_BYTE_CAP bytes (character boundary approximation)
      content = content.slice(0, PER_FILE_BYTE_CAP);
      truncated = true;
    }

    const remaining = TOTAL_BYTE_CAP - totalBytes;
    if (content.length > remaining) {
      content = content.slice(0, remaining);
      truncated = true;
    }

    totalBytes += content.length;

    const fence = '```';
    const ext = path.extname(relPath).replace('.', '');
    parts.push(
      `### File: ${relPath}\n${fence}${ext}\n${content}${truncated ? '\n// ... [truncated]' : ''}\n${fence}`
    );
  }

  return parts.join('\n\n');
}
