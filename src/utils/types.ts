export interface FileEntry {
  path: string;
  hash: string;
}

/**
 * Normalized commit view used by porcelain commands.
 * `files` is always a flat snapshot (from tree walk or legacy JSON).
 */
export interface Commit {
  id: string;
  timestamp: string;
  message: string;
  files: FileEntry[];
  /** Root tree object hash (v2). Absent on legacy v1 commits. */
  tree?: string;
  parent?: string;
}
