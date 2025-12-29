import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentBranch,
  getCurrentCommit,
  getCommit,
  getBlob,
} from "../utils/objects";
import type { Commit } from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

interface ListOptions {
  verbose?: boolean;
  limit?: number;
  snapshotId?: string;
}

/**
 * Get all commits from the repository (all branches)
 */
function getAllCommits(cwd: string): Commit[] {
  const tntDir = getTntDir(cwd);
  const commitsDir = path.join(tntDir, "commits");

  if (!fs.existsSync(commitsDir)) {
    return [];
  }

  const commitFiles = fs
    .readdirSync(commitsDir)
    .filter((f) => f.endsWith(".json"));
  const commits: Commit[] = [];

  for (const file of commitFiles) {
    try {
      const content = fs.readFileSync(path.join(commitsDir, file), "utf-8");
      const commit = JSON.parse(content) as Commit;
      commits.push(commit);
    } catch {
      // Skip invalid commit files
    }
  }

  // Sort by timestamp (newest first)
  commits.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return commits;
}

/**
 * Get branch name for a commit ID
 */
function getBranchForCommit(commitId: string, cwd: string): string | null {
  const tntDir = getTntDir(cwd);
  const headsDir = path.join(tntDir, "refs", "heads");

  if (!fs.existsSync(headsDir)) {
    return null;
  }

  const branches = fs.readdirSync(headsDir);

  for (const branch of branches) {
    const branchPath = path.join(headsDir, branch);
    const branchCommit = fs.readFileSync(branchPath, "utf-8").trim();

    if (branchCommit === commitId) {
      return branch;
    }
  }

  return null;
}

/**
 * Format date for display
 */
function formatDate(timestamp: string): { date: string; time: string } {
  const d = new Date(timestamp);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

/**
 * Truncate string with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Print compact snapshot list
 */
function printCompactList(
  commits: Commit[],
  currentCommitId: string | null,
  cwd: string,
) {
  console.log(`\n${BOLD}Snapshots (${commits.length}):${RESET}`);
  console.log(`${DIM}${"─".repeat(75)}${RESET}`);
  console.log(
    `  ${DIM}ID${" ".repeat(13)}DATE${" ".repeat(8)}TIME${" ".repeat(3)}FILES${" ".repeat(3)}MESSAGE${RESET}`,
  );
  console.log(`${DIM}${"─".repeat(75)}${RESET}`);

  for (const commit of commits) {
    const { date, time } = formatDate(commit.timestamp);
    const isCurrent = commit.id === currentCommitId;
    const marker = isCurrent ? `${GREEN}*${RESET}` : " ";
    const branch = getBranchForCommit(commit.id, cwd);
    const branchTag = branch ? ` ${DIM}(${branch})${RESET}` : "";
    const message = truncate(commit.message, 30);
    const filesCount = String(commit.files.length).padStart(3);

    console.log(
      `${marker} ${YELLOW}${commit.id}${RESET}  ${date}  ${time}  ${CYAN}${filesCount}${RESET}     ${message}${branchTag}`,
    );
  }

  console.log(`${DIM}${"─".repeat(75)}${RESET}`);
  console.log(`${DIM}Total: ${commits.length} snapshot(s)${RESET}`);

  if (currentCommitId) {
    console.log(`${DIM}${GREEN}*${RESET}${DIM} = current HEAD${RESET}`);
  }

  console.log();
}

/**
 * Print verbose snapshot list
 */
function printVerboseList(
  commits: Commit[],
  currentCommitId: string | null,
  cwd: string,
) {
  console.log(`\n${BOLD}Snapshots (verbose):${RESET}`);
  console.log(`${DIM}${"─".repeat(75)}${RESET}`);

  for (const commit of commits) {
    const { date, time } = formatDate(commit.timestamp);
    const isCurrent = commit.id === currentCommitId;
    const marker = isCurrent ? `${GREEN}●${RESET}` : `${DIM}○${RESET}`;
    const branch = getBranchForCommit(commit.id, cwd);
    const branchTag = branch
      ? isCurrent
        ? `  ${DIM}(HEAD → ${CYAN}${branch}${RESET}${DIM})${RESET}`
        : `  ${DIM}(${branch})${RESET}`
      : "";

    console.log(`\n${marker} ${YELLOW}${commit.id}${RESET}${branchTag}`);
    console.log(`  ${DIM}Date:${RESET}    ${date} ${time}`);
    console.log(`  ${DIM}Message:${RESET} ${commit.message}`);

    if (commit.parent) {
      console.log(`  ${DIM}Parent:${RESET}  ${commit.parent}`);
    } else {
      console.log(
        `  ${DIM}Parent:${RESET}  ${DIM}(none - initial commit)${RESET}`,
      );
    }

    console.log(`  ${DIM}Files:${RESET}   ${commit.files.length} file(s)`);

    // Show first few files
    const previewFiles = commit.files.slice(0, 5);
    const fileNames = previewFiles.map((f) => f.path).join(", ");
    const remaining = commit.files.length - previewFiles.length;
    const moreText = remaining > 0 ? `, ${DIM}+${remaining} more${RESET}` : "";
    console.log(`           ${DIM}${fileNames}${moreText}${RESET}`);
  }

  console.log(`\n${DIM}${"─".repeat(75)}${RESET}`);
  console.log(`${DIM}Total: ${commits.length} snapshot(s)${RESET}\n`);
}

/**
 * Print single snapshot details
 */
function printSnapshotDetails(
  commit: Commit,
  currentCommitId: string | null,
  cwd: string,
) {
  const { date, time } = formatDate(commit.timestamp);
  const isCurrent = commit.id === currentCommitId;
  const branch = getBranchForCommit(commit.id, cwd);

  console.log(`\n${BOLD}Snapshot: ${YELLOW}${commit.id}${RESET}`);

  if (isCurrent && branch) {
    console.log(`${DIM}(HEAD → ${CYAN}${branch}${RESET}${DIM})${RESET}`);
  } else if (branch) {
    console.log(`${DIM}(${branch})${RESET}`);
  }

  console.log(`${DIM}${"─".repeat(75)}${RESET}`);
  console.log(`  ${DIM}Message:${RESET}   ${commit.message}`);
  console.log(`  ${DIM}Date:${RESET}      ${date} ${time}`);

  if (commit.parent) {
    console.log(`  ${DIM}Parent:${RESET}    ${commit.parent}`);
  } else {
    console.log(
      `  ${DIM}Parent:${RESET}    ${DIM}(none - initial commit)${RESET}`,
    );
  }

  console.log(`\n  ${BOLD}Files (${commit.files.length}):${RESET}`);

  for (const file of commit.files) {
    console.log(`    ${file.path}  ${DIM}(${file.hash})${RESET}`);
  }

  console.log(`${DIM}${"─".repeat(75)}${RESET}\n`);
}

/**
 * Parse list command arguments
 */
function parseListArgs(args: string[]): ListOptions {
  const options: ListOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg) continue;

    if (arg === "-v" || arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "-n" || arg === "--limit") {
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        options.limit = parseInt(next, 10);
        i++;
      }
    } else if (!arg.startsWith("-")) {
      // Assume it's a snapshot ID
      options.snapshotId = arg;
    }
  }

  return options;
}

/**
 * List all snapshots with metadata
 */
export function list(args: string[] = []) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const options = parseListArgs(args);
  const currentCommitId = getCurrentCommit(cwd);

  // If a specific snapshot ID is provided, show its details
  if (options.snapshotId) {
    const commit = getCommit(options.snapshotId, cwd);

    if (!commit) {
      console.log(
        `\n${YELLOW}Snapshot '${options.snapshotId}' not found${RESET}`,
      );
      console.log(
        `${DIM}Run${RESET} tnt ls ${DIM}to see all snapshots${RESET}\n`,
      );
      return;
    }

    printSnapshotDetails(commit, currentCommitId, cwd);
    return;
  }

  // Get all commits
  let commits = getAllCommits(cwd);

  if (commits.length === 0) {
    console.log(`\n${DIM}No snapshots yet.${RESET}`);
    console.log(
      `${DIM}Create one with:${RESET} tnt stage . && tnt summ "message"\n`,
    );
    return;
  }

  // Apply limit if specified
  if (options.limit && options.limit > 0) {
    commits = commits.slice(0, options.limit);
  }

  // Print list
  if (options.verbose) {
    printVerboseList(commits, currentCommitId, cwd);
  } else {
    printCompactList(commits, currentCommitId, cwd);
  }
}
