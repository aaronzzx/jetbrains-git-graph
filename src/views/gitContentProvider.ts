import type * as vscode from "vscode";
import type { GitService } from "../git/gitService";

export const GIT_BRAINS_SCHEME = "git-brains";

/**
 * Provides virtual document content for git file revisions.
 * Uri format: git-brains:/<filePath>?ref=<commitHash>
 * Also supports shelf diff content via an external content map.
 */
export class GitContentProvider implements vscode.TextDocumentContentProvider {
  private externalContent: Map<string, string> | null = null;

  constructor(private readonly gitService: GitService) {}

  setExternalContentMap(map: Map<string, string>): void {
    this.externalContent = map;
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    // Check external content map first (used for shelf diffs)
    if (this.externalContent) {
      const external = this.externalContent.get(uri.toString());
      if (external !== undefined) {
        return external;
      }
    }

    const ref = new URLSearchParams(uri.query).get("ref") ?? "";
    const filePath = uri.path.startsWith("/") ? uri.path.slice(1) : uri.path;
    if (!ref || !filePath) {
      return "";
    }
    return this.gitService.getFileContent(ref, filePath);
  }
}
