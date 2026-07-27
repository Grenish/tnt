import fs from "fs";
import path from "path";
import { getTntDir, getFormatPath } from "./paths";
import {
  storeObject,
  readObject,
  hashObject,
  hashBytes,
  listObjectHashes,
} from "./store";
import type { ObjectType } from "./store";
import {
  nestFileEntries,
  writeNestedTrees,
  flattenTree,
  parseTree,
  serializeTree,
  serializeCommitBody,
  parseCommitBody,
} from "./tree";
import type { TreeEntry } from "./tree";
import type { FileEntry, Commit } from "./types";
import { explain, explainObject } from "./explain";

export type { FileEntry, Commit, TreeEntry, ObjectType };
export { getTntDir, getFormatPath } from "./paths";
export {
  storeObject,
  readObject,
  hashObject,
  hashBytes,
  listObjectHashes,
} from "./store";
export {
  nestFileEntries,
  writeNestedTrees,
  flattenTree,
  parseTree,
  serializeTree,
  serializeCommitBody,
  parseCommitBody,
} from "./tree";
export { setExplain, isExplain, explain, explainObject } from "./explain";

/**
 * Hash raw string content as a **v2 blob** id (typed object hash).
 * Prefer this over hashing bare content when comparing to storeObject("blob", ...).
 */
export function hashContent(content: string): string {
  return hashObject("blob", content);
}

/**
 * Check if current directory is a tnt repository
 */
export function isRepo(cwd: string = process.cwd()): boolean {
  return fs.existsSync(getTntDir(cwd));
}

/**
 * Repo format version: 2 = trees + content-addressed commits; 1 = legacy.
 */
export function getFormatVersion(cwd: string = process.cwd()): number {
  const formatPath = getFormatPath(cwd);
  if (fs.existsSync(formatPath)) {
    const n = parseInt(fs.readFileSync(formatPath, "utf-8").trim(), 10);
    return Number.isFinite(n) ? n : 1;
  }
  // Legacy repos have commits/*.json and no format file
  const commitsDir = path.join(getTntDir(cwd), "commits");
  if (fs.existsSync(commitsDir)) {
    const hasLegacy = fs
      .readdirSync(commitsDir)
      .some((f) => f.endsWith(".json"));
    if (hasLegacy) return 1;
  }
  return 2;
}

export function writeFormatVersion(
  version: number,
  cwd: string = process.cwd(),
): void {
  fs.writeFileSync(getFormatPath(cwd), String(version) + "\n");
}

/**
 * Store a blob (file content) and return its v2 content-addressed hash.
 */
export function storeBlob(
  content: string,
  cwd: string = process.cwd(),
): string {
  const hash = storeObject("blob", content, cwd);
  explainObject("blob", hash, `${Buffer.byteLength(content, "utf-8")} bytes`);
  return hash;
}

/**
 * Retrieve blob content by hash (v2 typed or v1 raw).
 */
export function getBlob(
  hash: string,
  cwd: string = process.cwd(),
): string | null {
  const obj = readObject(hash, cwd);
  if (!obj) return null;
  if (obj.type !== "blob") {
    return null;
  }
  return obj.content;
}

/**
 * Write a tree object from a flat file list. Returns root tree hash.
 */
export function writeTree(
  files: FileEntry[],
  cwd: string = process.cwd(),
): string {
  const nested = nestFileEntries(files);
  const hash = writeNestedTrees(nested, (body) =>
    storeObject("tree", body, cwd),
  );
  explainObject("tree", hash, `${files.length} file(s) in snapshot`);
  return hash;
}

/**
 * Read tree entries for a tree object hash.
 */
export function getTree(
  hash: string,
  cwd: string = process.cwd(),
): TreeEntry[] | null {
  const obj = readObject(hash, cwd);
  if (!obj || obj.type !== "tree") return null;
  return parseTree(obj.content);
}

/**
 * Flatten a root tree into FileEntry[].
 */
export function flattenTreeToFiles(
  rootHash: string,
  cwd: string = process.cwd(),
): FileEntry[] {
  return flattenTree(rootHash, (h) => getTree(h, cwd));
}

/**
 * Create and store a commit object. Returns content-addressed commit id.
 */
export function writeCommit(
  fields: {
    tree: string;
    parent?: string;
    message: string;
    timestamp?: string;
  },
  cwd: string = process.cwd(),
): string {
  const timestamp = fields.timestamp ?? new Date().toISOString();
  const body = serializeCommitBody({
    tree: fields.tree,
    parent: fields.parent,
    timestamp,
    message: fields.message,
  });
  const id = storeObject("commit", body, cwd);
  explainObject(
    "commit",
    id,
    fields.parent ? `parent ${fields.parent}` : "root commit",
  );
  return id;
}

/**
 * Get current branch name or null if detached HEAD
 */
export function getCurrentBranch(cwd: string = process.cwd()): string | null {
  const headPath = path.join(getTntDir(cwd), "HEAD");

  if (!fs.existsSync(headPath)) {
    return null;
  }

  const headContent = fs.readFileSync(headPath, "utf-8").trim();

  if (headContent.startsWith("ref: refs/heads/")) {
    return headContent.replace("ref: refs/heads/", "");
  }

  return null;
}

/**
 * Get the current commit hash
 */
export function getCurrentCommit(cwd: string = process.cwd()): string | null {
  const headPath = path.join(getTntDir(cwd), "HEAD");

  if (!fs.existsSync(headPath)) {
    return null;
  }

  const headContent = fs.readFileSync(headPath, "utf-8").trim();

  if (headContent.startsWith("ref: ")) {
    const refPath = path.join(getTntDir(cwd), headContent.replace("ref: ", ""));

    if (fs.existsSync(refPath)) {
      const commitId = fs.readFileSync(refPath, "utf-8").trim();
      return commitId || null;
    }

    return null;
  }

  return headContent || null;
}

/**
 * Update the current branch to point to a commit
 */
export function updateBranchCommit(
  commitId: string,
  cwd: string = process.cwd(),
): void {
  const headPath = path.join(getTntDir(cwd), "HEAD");
  const headContent = fs.readFileSync(headPath, "utf-8").trim();

  if (headContent.startsWith("ref: ")) {
    const refPath = path.join(getTntDir(cwd), headContent.replace("ref: ", ""));
    fs.writeFileSync(refPath, commitId);
    explain(`advanced ref ${headContent.replace("ref: ", "")} → ${commitId}`);
  } else {
    fs.writeFileSync(headPath, commitId);
    explain(`updated detached HEAD → ${commitId}`);
  }
}

/**
 * Resolve a commit from v2 object store or legacy commits/<id>.json.
 */
export function getCommit(
  commitId: string,
  cwd: string = process.cwd(),
): Commit | null {
  // v2 object
  const obj = readObject(commitId, cwd);
  if (obj && obj.type === "commit") {
    const parsed = parseCommitBody(obj.content);
    const files = parsed.tree
      ? flattenTreeToFiles(parsed.tree, cwd)
      : [];
    return {
      id: commitId,
      tree: parsed.tree,
      parent: parsed.parent,
      timestamp: parsed.timestamp,
      message: parsed.message,
      files,
    };
  }

  // Legacy v1 JSON
  const commitPath = path.join(getTntDir(cwd), "commits", `${commitId}.json`);
  if (fs.existsSync(commitPath)) {
    const data = JSON.parse(fs.readFileSync(commitPath, "utf-8")) as Commit;
    return {
      id: data.id ?? commitId,
      timestamp: data.timestamp,
      message: data.message,
      files: data.files ?? [],
      parent: data.parent,
      tree: data.tree,
    };
  }

  return null;
}

/**
 * Collect all commits reachable from refs + legacy commits dir + object scan.
 */
export function listAllCommits(cwd: string = process.cwd()): Commit[] {
  const byId = new Map<string, Commit>();

  // From branch tips walk parents
  const headsDir = path.join(getTntDir(cwd), "refs", "heads");
  if (fs.existsSync(headsDir)) {
    for (const name of fs.readdirSync(headsDir)) {
      const tip = fs
        .readFileSync(path.join(headsDir, name), "utf-8")
        .trim();
      let id: string | null = tip || null;
      while (id) {
        if (byId.has(id)) break;
        const c = getCommit(id, cwd);
        if (!c) break;
        byId.set(id, c);
        id = c.parent || null;
      }
    }
  }

  // Legacy JSON files
  const commitsDir = path.join(getTntDir(cwd), "commits");
  if (fs.existsSync(commitsDir)) {
    for (const file of fs.readdirSync(commitsDir)) {
      if (!file.endsWith(".json")) continue;
      const id = file.replace(/\.json$/, "");
      if (byId.has(id)) continue;
      const c = getCommit(id, cwd);
      if (c) byId.set(id, c);
    }
  }

  // Scan objects for any commit not yet seen
  for (const hash of listObjectHashes(cwd)) {
    if (byId.has(hash)) continue;
    const obj = readObject(hash, cwd);
    if (obj?.type === "commit") {
      const c = getCommit(hash, cwd);
      if (c) byId.set(hash, c);
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Parse .tntignore file and return an array of patterns
 */
export function parseIgnorePatterns(cwd: string = process.cwd()): string[] {
  const ignorePath = path.join(cwd, ".tntignore");
  const patterns: string[] = [];

  patterns.push(".tnt", ".git");

  if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        patterns.push(trimmed);
      }
    }
  }

  return patterns;
}

/**
 * Check if a path matches a single ignore pattern (pure; no filesystem).
 */
export function matchesPattern(filePath: string, pattern: string): boolean {
  let normalizedPattern = pattern;

  const isDirectoryPattern = pattern.endsWith("/");
  if (isDirectoryPattern) {
    normalizedPattern = pattern.slice(0, -1);
  }

  if (normalizedPattern.includes("*")) {
    const regexPattern = normalizedPattern
      .replace(/\./g, "\\.")
      .replace(/\*\*/g, "<<<GLOBSTAR>>>")
      .replace(/\*/g, "[^/]*")
      .replace(/<<<GLOBSTAR>>>/g, ".*");

    const regex = new RegExp(`(^|/)${regexPattern}($|/)`);
    return regex.test(filePath);
  }

  const pathParts = filePath.split("/");

  if (pathParts.includes(normalizedPattern)) {
    return true;
  }

  if (
    filePath.startsWith(normalizedPattern + "/") ||
    filePath === normalizedPattern
  ) {
    return true;
  }

  for (let i = 0; i < pathParts.length; i++) {
    const partialPath = pathParts.slice(0, i + 1).join("/");
    if (partialPath === normalizedPattern) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a path should be ignored based on .tntignore patterns
 */
export function shouldIgnore(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (matchesPattern(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Collect all files in a directory recursively, respecting .tntignore
 */
export function collectFiles(
  dir: string,
  cwd: string = process.cwd(),
): string[] {
  const result: string[] = [];
  const patterns = parseIgnorePatterns(cwd);

  function collect(currentDir: string): void {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    for (const item of fs.readdirSync(currentDir)) {
      const full = path.join(currentDir, item);
      const relative = path.relative(cwd, full);

      if (shouldIgnore(relative, patterns)) {
        continue;
      }

      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        collect(full);
      } else {
        result.push(relative);
      }
    }
  }

  collect(dir);
  return result;
}

/**
 * Compute hash of a file's current content (v2 blob hash).
 */
export function hashFile(
  filePath: string,
  cwd: string = process.cwd(),
): string | null {
  const fullPath = path.join(cwd, filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  return hashContent(content);
}

/**
 * Resolve a revision string to a commit id:
 * HEAD, branch name, hash / prefix, or ancestry like HEAD~1 / abc~2.
 */
export function resolveRevision(
  rev: string,
  cwd: string = process.cwd(),
): string | null {
  if (!rev || rev === "HEAD") {
    return getCurrentCommit(cwd);
  }

  // Ancestry: <base>~N  or  <base>~  (means ~1)
  const tildeMatch = /^(.+?)~(\d*)$/.exec(rev);
  if (tildeMatch) {
    const base = tildeMatch[1]!;
    const n = tildeMatch[2] === "" ? 1 : parseInt(tildeMatch[2]!, 10);
    if (!Number.isFinite(n) || n < 0) return null;

    let id = resolveRevision(base, cwd);
    for (let i = 0; i < n; i++) {
      if (!id) return null;
      const commit = getCommit(id, cwd);
      id = commit?.parent ?? null;
    }
    return id;
  }

  // Branch name
  const branchPath = path.join(getTntDir(cwd), "refs", "heads", rev);
  if (fs.existsSync(branchPath)) {
    const id = fs.readFileSync(branchPath, "utf-8").trim();
    return id || null;
  }

  // Exact commit
  if (getCommit(rev, cwd)) {
    return rev;
  }

  // Unique prefix match among commits / objects
  const all = listAllCommits(cwd);
  const matches = all.filter((c) => c.id.startsWith(rev));
  if (matches.length === 1) {
    return matches[0]!.id;
  }

  const hashes = listObjectHashes(cwd).filter((h) => h.startsWith(rev));
  if (hashes.length === 1) {
    return hashes[0]!;
  }

  return null;
}
