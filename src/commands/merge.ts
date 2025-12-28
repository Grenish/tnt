import fs from "fs";
import path from "path";
import * as readline from "readline";
import { getTntDir, isRepo, getCommit, getBlob } from "../utils/objects";
import type { Commit, FileEntry } from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

interface MergeAnalysis {
  added: FileEntry[]; // Files only in source (will be added)
  updated: FileEntry[]; // Files in both but different (source wins)
  unchanged: FileEntry[]; // Files in both with same content
  kept: FileEntry[]; // Files only in target (will be kept)
}

function getCommitFromBranch(branchName: string, cwd: string): Commit | null {
  const tntDir = getTntDir(cwd);
  const branchPath = path.join(tntDir, "refs", "heads", branchName);

  if (!fs.existsSync(branchPath)) {
    return null;
  }

  const commitId = fs.readFileSync(branchPath, "utf-8").trim();

  if (!commitId) {
    return null;
  }

  return getCommit(commitId, cwd);
}

function analyzeMerge(
  targetCommit: Commit | null,
  sourceCommit: Commit | null,
): MergeAnalysis {
  const analysis: MergeAnalysis = {
    added: [],
    updated: [],
    unchanged: [],
    kept: [],
  };

  const targetFiles = new Map<string, FileEntry>();
  const sourceFiles = new Map<string, FileEntry>();

  if (targetCommit) {
    for (const file of targetCommit.files) {
      targetFiles.set(file.path, file);
    }
  }

  if (sourceCommit) {
    for (const file of sourceCommit.files) {
      sourceFiles.set(file.path, file);
    }
  }

  // Check files in source branch
  for (const [filePath, sourceFile] of sourceFiles) {
    const targetFile = targetFiles.get(filePath);

    if (!targetFile) {
      // Case 2: File only in source = new file to add
      analysis.added.push(sourceFile);
    } else if (targetFile.hash === sourceFile.hash) {
      // Same content = unchanged
      analysis.unchanged.push(sourceFile);
    } else {
      // Case 1: Different content = source wins (upgrade)
      analysis.updated.push(sourceFile);
    }
  }

  // Case 3: Files only in target = keep them
  for (const [filePath, targetFile] of targetFiles) {
    if (!sourceFiles.has(filePath)) {
      analysis.kept.push(targetFile);
    }
  }

  return analysis;
}

function printMergeSummary(
  targetBranch: string,
  sourceBranch: string,
  analysis: MergeAnalysis,
  cwd: string,
) {
  console.log(`\n${BOLD}Merge Summary${RESET}`);
  console.log(`${DIM}─────────────────────────────────${RESET}`);
  console.log(
    `${CYAN}${sourceBranch}${RESET} ${DIM}→${RESET} ${CYAN}${targetBranch}${RESET}\n`,
  );

  if (analysis.added.length > 0) {
    console.log(`${GREEN}+ ${analysis.added.length} new file(s)${RESET}`);
    for (const file of analysis.added) {
      console.log(`  ${GREEN}+${RESET} ${file.path}`);
    }
  }

  if (analysis.updated.length > 0) {
    console.log(
      `${YELLOW}↑ ${analysis.updated.length} file(s) to upgrade${RESET}`,
    );
    for (const file of analysis.updated) {
      const content = getBlob(file.hash, cwd);
      const lines = content ? content.split("\n").length : 0;
      console.log(
        `  ${YELLOW}↑${RESET} ${file.path} ${DIM}(${lines} lines)${RESET}`,
      );
    }
  }

  if (analysis.kept.length > 0) {
    console.log(
      `${DIM}○ ${analysis.kept.length} file(s) kept (target only)${RESET}`,
    );
    for (const file of analysis.kept) {
      console.log(`  ${DIM}○ ${file.path}${RESET}`);
    }
  }

  if (analysis.unchanged.length > 0) {
    console.log(
      `${DIM}= ${analysis.unchanged.length} file(s) unchanged${RESET}`,
    );
  }

  console.log(`${DIM}─────────────────────────────────${RESET}`);
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

function performMerge(
  targetBranch: string,
  sourceBranch: string,
  analysis: MergeAnalysis,
  cwd: string,
) {
  const tntDir = getTntDir(cwd);
  const commitsDir = path.join(tntDir, "commits");
  const targetBranchPath = path.join(tntDir, "refs", "heads", targetBranch);

  // Build merged file list
  const mergedFiles: FileEntry[] = [];

  // Add unchanged files (same in both)
  for (const file of analysis.unchanged) {
    mergedFiles.push(file);
  }

  // Add new files from source
  for (const file of analysis.added) {
    mergedFiles.push(file);
  }

  // Add updated files (source version wins)
  for (const file of analysis.updated) {
    mergedFiles.push(file);
  }

  // Keep files that only exist in target
  for (const file of analysis.kept) {
    mergedFiles.push(file);
  }

  // Create merge commit
  const commitId = Date.now().toString();
  const targetCommitId = fs.existsSync(targetBranchPath)
    ? fs.readFileSync(targetBranchPath, "utf-8").trim()
    : "";

  const mergeCommit: Commit = {
    id: commitId,
    timestamp: new Date().toISOString(),
    message: `Merge branch '${sourceBranch}' into ${targetBranch}`,
    files: mergedFiles,
    parent: targetCommitId || undefined,
  };

  // Save commit
  if (!fs.existsSync(commitsDir)) {
    fs.mkdirSync(commitsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(commitsDir, `${commitId}.json`),
    JSON.stringify(mergeCommit, null, 2),
  );

  // Update target branch to point to merge commit
  fs.writeFileSync(targetBranchPath, commitId);

  // Restore merged files to working directory
  for (const file of mergedFiles) {
    const content = getBlob(file.hash, cwd);

    if (content !== null) {
      const fullPath = path.join(cwd, file.path);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
    }
  }

  return mergeCommit;
}

export async function merge(targetBranch?: string, sourceBranch?: string) {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);

  // Validation
  if (!isRepo(cwd)) {
    console.log(`${RED}tnt: not a repository${RESET}`);
    return;
  }

  if (!targetBranch || !sourceBranch) {
    console.log(`\n${YELLOW}Usage: tnt -m <target> -u <source>${RESET}`);
    console.log(`${DIM}Merges <source> branch into <target> branch${RESET}`);
    console.log(`${DIM}Example: tnt -m main -u feature${RESET}\n`);
    return;
  }

  // Check branches exist
  const targetPath = path.join(tntDir, "refs", "heads", targetBranch);
  const sourcePath = path.join(tntDir, "refs", "heads", sourceBranch);

  if (!fs.existsSync(targetPath)) {
    console.log(`${RED}tnt: branch '${targetBranch}' does not exist${RESET}\n`);
    return;
  }

  if (!fs.existsSync(sourcePath)) {
    console.log(`${RED}tnt: branch '${sourceBranch}' does not exist${RESET}\n`);
    return;
  }

  if (targetBranch === sourceBranch) {
    console.log(`${YELLOW}tnt: cannot merge a branch into itself${RESET}\n`);
    return;
  }

  // Get commits from both branches
  const targetCommit = getCommitFromBranch(targetBranch, cwd);
  const sourceCommit = getCommitFromBranch(sourceBranch, cwd);

  if (!sourceCommit) {
    console.log(
      `${YELLOW}tnt: branch '${sourceBranch}' has no commits${RESET}\n`,
    );
    return;
  }

  // Analyze the merge
  const analysis = analyzeMerge(targetCommit, sourceCommit);

  // Check if there's anything to merge
  if (analysis.added.length === 0 && analysis.updated.length === 0) {
    console.log(`\n${DIM}Already up to date. Nothing to merge.${RESET}\n`);
    return;
  }

  // Print summary
  printMergeSummary(targetBranch, sourceBranch, analysis, cwd);

  // Ask for confirmation
  const totalChanges = analysis.added.length + analysis.updated.length;
  const confirmed = await askConfirmation(
    `\n${BOLD}Apply ${totalChanges} change(s)?${RESET} ${DIM}(y/n)${RESET} `,
  );

  if (!confirmed) {
    console.log(`\n${DIM}Merge cancelled.${RESET}\n`);
    return;
  }

  // Perform the merge
  const mergeCommit = performMerge(targetBranch, sourceBranch, analysis, cwd);

  console.log(`\n${GREEN}✓${RESET} ${BOLD}Merge successful!${RESET}`);
  console.log(`${DIM}Commit:${RESET}  ${mergeCommit.id}`);
  console.log(`${DIM}Message:${RESET} ${mergeCommit.message}`);
  console.log(
    `${DIM}Changes:${RESET} ${GREEN}+${analysis.added.length} new${RESET}, ${YELLOW}↑${analysis.updated.length} upgraded${RESET}, ${DIM}○${analysis.kept.length} kept${RESET}\n`,
  );
}
