import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Compute SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

/**
 * Get the .tnt directory path
 */
export function getTntDir(cwd: string = process.cwd()): string {
  return path.join(cwd, ".tnt");
}

/**
 * Check if current directory is a tnt repository
 */
export function isRepo(cwd: string = process.cwd()): boolean {
  return fs.existsSync(getTntDir(cwd));
}

/**
 * Store a blob (file content) and return its hash
 */
export function storeBlob(
  content: string,
  cwd: string = process.cwd(),
): string {
  const hash = hashContent(content);
  const blobDir = path.join(getTntDir(cwd), "objects");

  if (!fs.existsSync(blobDir)) {
    fs.mkdirSync(blobDir, { recursive: true });
  }

  const blobPath = path.join(blobDir, hash);

  if (!fs.existsSync(blobPath)) {
    fs.writeFileSync(blobPath, content);
  }

  return hash;
}

/**
 * Retrieve blob content by hash
 */
export function getBlob(
  hash: string,
  cwd: string = process.cwd(),
): string | null {
  const blobPath = path.join(getTntDir(cwd), "objects", hash);

  if (!fs.existsSync(blobPath)) {
    return null;
  }

  return fs.readFileSync(blobPath, "utf-8");
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
  } else {
    // Detached HEAD - update HEAD directly
    fs.writeFileSync(headPath, commitId);
  }
}

export interface FileEntry {
  path: string;
  hash: string;
}

export interface Commit {
  id: string;
  timestamp: string;
  message: string;
  files: FileEntry[];
  parent?: string;
}

/**
 * Get a commit by its ID
 */
export function getCommit(
  commitId: string,
  cwd: string = process.cwd(),
): Commit | null {
  const commitPath = path.join(getTntDir(cwd), "commits", `${commitId}.json`);

  if (!fs.existsSync(commitPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(commitPath, "utf-8"));
}

/**
 * Parse .tntignore file and return an array of patterns
 */
export function parseIgnorePatterns(cwd: string = process.cwd()): string[] {
  const ignorePath = path.join(cwd, ".tntignore");
  const patterns: string[] = [];

  // Always ignore these system directories
  patterns.push(".tnt", ".git");

  if (fs.existsSync(ignorePath)) {
    const content = fs.readFileSync(ignorePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (trimmed && !trimmed.startsWith("#")) {
        patterns.push(trimmed);
      }
    }
  }

  return patterns;
}

/**
 * Check if a path matches an ignore pattern
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Normalize the pattern
  let normalizedPattern = pattern;

  // Handle directory patterns (ending with /)
  const isDirectoryPattern = pattern.endsWith("/");
  if (isDirectoryPattern) {
    normalizedPattern = pattern.slice(0, -1);
  }

  // Handle glob patterns
  if (normalizedPattern.includes("*")) {
    // Convert glob pattern to regex
    const regexPattern = normalizedPattern
      .replace(/\./g, "\\.")
      .replace(/\*\*/g, "<<<GLOBSTAR>>>")
      .replace(/\*/g, "[^/]*")
      .replace(/<<<GLOBSTAR>>>/g, ".*");

    const regex = new RegExp(`(^|/)${regexPattern}($|/)`);
    return regex.test(filePath);
  }

  // Exact match or path component match
  const pathParts = filePath.split("/");

  // Check if any path component matches exactly
  if (pathParts.includes(normalizedPattern)) {
    return true;
  }

  // Check if the path starts with the pattern
  if (
    filePath.startsWith(normalizedPattern + "/") ||
    filePath === normalizedPattern
  ) {
    return true;
  }

  // Check if any parent directory matches
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

      // Check if this path should be ignored
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
 * Compute hash of a file's current content
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
