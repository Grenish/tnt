import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  storeBlob,
  parseIgnorePatterns,
  shouldIgnore,
} from "../utils/objects";

export interface StagedFile {
  path: string;
  hash: string;
}

export interface Index {
  files: StagedFile[];
}

export function stage(inputs: string[]) {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository (run `tnt init` first)");
    return;
  }

  const index: Index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  const filesToAdd = resolveFiles(inputs, cwd);

  let stagedCount = 0;

  for (const file of filesToAdd) {
    const fullPath = path.join(cwd, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const hash = storeBlob(content, cwd);

    // Check if file already staged with same hash
    const existingIndex = index.files.findIndex((f) => f.path === file);

    if (existingIndex >= 0) {
      // Update hash if file changed
      const existingFile = index.files[existingIndex];
      if (existingFile && existingFile.hash !== hash) {
        existingFile.hash = hash;
        stagedCount++;
      }
    } else {
      // Add new file
      index.files.push({ path: file, hash });
      stagedCount++;
    }
  }

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`Staged ${stagedCount} file(s)`);
}

function resolveFiles(inputs: string[], cwd: string): string[] {
  const results: string[] = [];
  const patterns = parseIgnorePatterns(cwd);

  for (const input of inputs) {
    const fullPath = path.join(cwd, input);

    if (!fs.existsSync(fullPath)) continue;

    const stat = fs.statSync(fullPath);
    const relativePath = path.relative(cwd, fullPath);

    // Check if this path should be ignored
    if (shouldIgnore(relativePath, patterns)) {
      continue;
    }

    if (stat.isFile()) {
      results.push(relativePath);
    }

    if (stat.isDirectory()) {
      results.push(...resolveDirectory(fullPath, cwd, patterns));
    }
  }

  return results;
}

function resolveDirectory(
  dir: string,
  cwd: string,
  patterns: string[],
): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    const relativePath = path.relative(cwd, entryPath);

    // Check if this path should be ignored
    if (shouldIgnore(relativePath, patterns)) {
      continue;
    }

    const entryStat = fs.statSync(entryPath);

    if (entryStat.isFile()) {
      results.push(relativePath);
    } else if (entryStat.isDirectory()) {
      results.push(...resolveDirectory(entryPath, cwd, patterns));
    }
  }

  return results;
}
