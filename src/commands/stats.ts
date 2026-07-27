import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentBranch,
  getCurrentCommit,
  getCommit,
  getBlob,
  collectFiles,
  hashContent,
} from "../utils/objects";
import { computeLineDiff } from "../utils/diff";
import type { FileDiff } from "../utils/diff";
import type { Index } from "./stage";
import { printWorkingTreePatches } from "./diff";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

export function stats(rawArgs: string[] = []) {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");
  const showPatch =
    rawArgs.includes("--patch") ||
    rawArgs.includes("-p") ||
    rawArgs.includes("--diff");

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  // Show current branch
  const currentBranch = getCurrentBranch(cwd);
  const currentCommit = getCurrentCommit(cwd);

  console.log();
  if (currentBranch) {
    console.log(`${BOLD}On branch ${CYAN}${currentBranch}${RESET}`);
  } else if (currentCommit) {
    console.log(
      `${BOLD}HEAD detached at ${CYAN}${currentCommit.slice(0, 8)}${RESET}`,
    );
  } else {
    console.log(
      `${BOLD}On branch ${CYAN}main${RESET} ${DIM}(no commits yet)${RESET}`,
    );
  }

  // Load index
  const index: Index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const stagedFiles = new Map<string, string>();

  for (const file of index.files) {
    stagedFiles.set(file.path, file.hash);
  }

  // Load committed files from current commit
  const committedFiles = new Map<string, string>();

  if (currentCommit) {
    const commit = getCommit(currentCommit, cwd);

    if (commit) {
      for (const file of commit.files) {
        committedFiles.set(file.path, file.hash);
      }
    }
  }

  // Get all current files in working directory
  const workingFiles = collectFiles(cwd, cwd);

  // Categorize files
  const staged: { path: string; diff?: FileDiff; status: string }[] = [];
  const modified: { path: string; diff: FileDiff }[] = [];
  const untracked: string[] = [];

  // Check staged files
  for (const [filePath, stagedHash] of stagedFiles) {
    const committedHash = committedFiles.get(filePath);

    if (!committedHash) {
      // New file
      const content = getBlob(stagedHash, cwd);
      const lines = content ? content.split("\n").length : 0;
      staged.push({
        path: filePath,
        status: "new file",
        diff: { added: lines, removed: 0 },
      });
    } else if (stagedHash !== committedHash) {
      // Modified file
      const diff = computeLineDiff(
        getBlob(committedHash, cwd) || "",
        getBlob(stagedHash, cwd) || "",
      );
      staged.push({ path: filePath, status: "modified", diff });
    }
  }

  // Check working directory for modifications and untracked files
  for (const filePath of workingFiles) {
    const fullPath = path.join(cwd, filePath);
    const currentContent = fs.readFileSync(fullPath, "utf-8");
    const currentHash = hashContent(currentContent);

    const stagedHash = stagedFiles.get(filePath);
    const committedHash = committedFiles.get(filePath);

    if (stagedHash) {
      // File is staged - check if working copy differs from staged
      if (currentHash !== stagedHash) {
        const stagedContent = getBlob(stagedHash, cwd) || "";
        const diff = computeLineDiff(stagedContent, currentContent);
        modified.push({ path: filePath, diff });
      }
    } else if (committedHash) {
      // File is committed but not staged - check if modified
      if (currentHash !== committedHash) {
        const committedContent = getBlob(committedHash, cwd) || "";
        const diff = computeLineDiff(committedContent, currentContent);
        modified.push({ path: filePath, diff });
      }
    } else {
      // File is neither staged nor committed
      untracked.push(filePath);
    }
  }

  // Check for deleted files (in commit but not in working directory)
  const deleted: string[] = [];

  for (const [filePath] of committedFiles) {
    const fullPath = path.join(cwd, filePath);

    if (!fs.existsSync(fullPath) && !stagedFiles.has(filePath)) {
      deleted.push(filePath);
    }
  }

  // Print results
  if (staged.length > 0) {
    console.log(`\n${BOLD}Changes to be committed:${RESET}`);
    console.log(`  ${DIM}(use "tnt summ <message>" to commit)${RESET}\n`);

    for (const file of staged) {
      const diffStr = file.diff
        ? ` ${GREEN}+${file.diff.added}${RESET} ${RED}-${file.diff.removed}${RESET}`
        : "";
      console.log(`  ${GREEN}${file.status}:${RESET}  ${file.path}${diffStr}`);
    }
  }

  if (modified.length > 0 || deleted.length > 0) {
    console.log(`\n${BOLD}Changes not staged for commit:${RESET}`);
    console.log(`  ${DIM}(use "tnt stage <file>..." to stage)${RESET}\n`);

    for (const file of modified) {
      const diffStr = `${GREEN}+${file.diff.added}${RESET} ${RED}-${file.diff.removed}${RESET}`;
      console.log(`  ${YELLOW}modified:${RESET}  ${file.path}  ${diffStr}`);
    }

    for (const filePath of deleted) {
      console.log(`  ${RED}deleted:${RESET}   ${filePath}`);
    }
  }

  if (untracked.length > 0) {
    console.log(`\n${BOLD}Untracked files:${RESET}`);
    console.log(
      `  ${DIM}(use "tnt stage <file>..." to include in commit)${RESET}\n`,
    );

    for (const filePath of untracked) {
      console.log(`  ${RED}${filePath}${RESET}`);
    }
  }

  if (
    staged.length === 0 &&
    modified.length === 0 &&
    deleted.length === 0 &&
    untracked.length === 0
  ) {
    console.log(`\n${DIM}Nothing to commit, working tree clean${RESET}`);
  }

  console.log();

  if (showPatch && (modified.length > 0 || deleted.length > 0)) {
    printWorkingTreePatches(cwd);
  } else if (showPatch) {
    console.log(
      `${DIM}(no unstaged changes to show; try ${RESET}tnt diff --staged${DIM})${RESET}\n`,
    );
  }
}
