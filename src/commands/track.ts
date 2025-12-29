import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  getCommit,
  collectFiles,
  hashContent,
} from "../utils/objects";
import type { Index } from "./stage";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

interface FileStatus {
  path: string;
  status: "tracked" | "modified" | "staged" | "untracked" | "deleted";
}

export function track() {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  // Load index (staging area)
  const index: Index = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, "utf-8"))
    : { files: [] };

  const stagedFiles = new Map<string, string>();
  for (const file of index.files) {
    stagedFiles.set(file.path, file.hash);
  }

  // Load committed files from current commit
  const committedFiles = new Map<string, string>();
  const currentCommitId = getCurrentCommit(cwd);

  if (currentCommitId) {
    const commit = getCommit(currentCommitId, cwd);
    if (commit) {
      for (const file of commit.files) {
        committedFiles.set(file.path, file.hash);
      }
    }
  }

  // Get all current files in working directory
  const workingFiles = collectFiles(cwd, cwd);
  const workingFilesSet = new Set(workingFiles);

  // Categorize all files
  const allFiles: FileStatus[] = [];
  const allPaths = new Set<string>();

  // Add all paths from committed, staged, and working files
  for (const [filePath] of committedFiles) {
    allPaths.add(filePath);
  }
  for (const [filePath] of stagedFiles) {
    allPaths.add(filePath);
  }
  for (const filePath of workingFiles) {
    allPaths.add(filePath);
  }

  // Counters
  let trackedCount = 0;
  let stagedCount = 0;
  let modifiedCount = 0;
  let untrackedCount = 0;
  let deletedCount = 0;

  // Determine status for each file
  for (const filePath of Array.from(allPaths).sort()) {
    const isCommitted = committedFiles.has(filePath);
    const isStaged = stagedFiles.has(filePath);
    const existsInWorking = workingFilesSet.has(filePath);

    // Get current file hash if it exists
    let currentHash: string | null = null;
    if (existsInWorking) {
      const fullPath = path.join(cwd, filePath);
      const content = fs.readFileSync(fullPath, "utf-8");
      currentHash = hashContent(content);
    }

    const committedHash = committedFiles.get(filePath);
    const stagedHash = stagedFiles.get(filePath);

    let status: FileStatus["status"];

    if (isStaged && !isCommitted) {
      // New file that's staged but not yet committed
      status = "staged";
      stagedCount++;
    } else if (isStaged && isCommitted && stagedHash !== committedHash) {
      // File is staged with changes
      status = "staged";
      stagedCount++;
    } else if (!existsInWorking && (isCommitted || isStaged)) {
      // File was committed/staged but deleted from working directory
      status = "deleted";
      deletedCount++;
    } else if (!isCommitted && !isStaged && existsInWorking) {
      // File exists but is not tracked
      status = "untracked";
      untrackedCount++;
    } else if (isCommitted && existsInWorking && currentHash !== committedHash && !isStaged) {
      // File is tracked but modified (and not staged)
      status = "modified";
      modifiedCount++;
    } else if (isCommitted && existsInWorking) {
      // File is tracked and unchanged
      status = "tracked";
      trackedCount++;
    } else {
      continue; // Skip files we can't categorize
    }

    allFiles.push({ path: filePath, status });
  }

  // Print output
  console.log(`\n${BOLD}Files in repository:${RESET}`);
  console.log(`${DIM}${"─".repeat(50)}${RESET}`);

  if (allFiles.length === 0) {
    console.log(`${DIM}  No files found${RESET}`);
  } else {
    for (const file of allFiles) {
      const icon = getStatusIcon(file.status);
      const label = getStatusLabel(file.status);
      console.log(`  ${icon} ${file.path}${label}`);
    }
  }

  console.log(`${DIM}${"─".repeat(50)}${RESET}`);

  // Print summary
  const summaryParts: string[] = [];
  if (trackedCount > 0) summaryParts.push(`${trackedCount} tracked`);
  if (stagedCount > 0) summaryParts.push(`${stagedCount} staged`);
  if (modifiedCount > 0) summaryParts.push(`${modifiedCount} modified`);
  if (untrackedCount > 0) summaryParts.push(`${untrackedCount} untracked`);
  if (deletedCount > 0) summaryParts.push(`${deletedCount} deleted`);

  if (summaryParts.length > 0) {
    console.log(`${DIM}${summaryParts.join(", ")}${RESET}`);
  } else {
    console.log(`${DIM}No files${RESET}`);
  }

  console.log();
}

function getStatusIcon(status: FileStatus["status"]): string {
  switch (status) {
    case "tracked":
      return `${GREEN}✓${RESET}`;
    case "modified":
      return `${YELLOW}M${RESET}`;
    case "staged":
      return `${CYAN}+${RESET}`;
    case "untracked":
      return `${RED}?${RESET}`;
    case "deleted":
      return `${RED}D${RESET}`;
    default:
      return " ";
  }
}

function getStatusLabel(status: FileStatus["status"]): string {
  switch (status) {
    case "modified":
      return `  ${DIM}(modified)${RESET}`;
    case "staged":
      return `  ${DIM}(staged)${RESET}`;
    case "untracked":
      return `  ${DIM}(untracked)${RESET}`;
    case "deleted":
      return `  ${DIM}(deleted)${RESET}`;
    default:
      return "";
  }
}
