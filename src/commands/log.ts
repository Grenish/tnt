import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentBranch,
  getCurrentCommit,
  getCommit,
} from "../utils/objects";
import type { Commit } from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

export function log() {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const currentBranch = getCurrentBranch(cwd);
  const currentCommitId = getCurrentCommit(cwd);

  if (!currentCommitId) {
    console.log("\nNo commits yet.\n");
    return;
  }

  // Collect all commits in the chain
  const commits: Commit[] = [];
  let commitId: string | null = currentCommitId;

  while (commitId) {
    const commit = getCommit(commitId, cwd);

    if (!commit) {
      break;
    }

    commits.push(commit);
    commitId = commit.parent || null;
  }

  if (commits.length === 0) {
    console.log("\nNo commits yet.\n");
    return;
  }

  // Print header
  const branchDisplay = currentBranch || "detached HEAD";
  console.log(
    `\n${BOLD}Commit history for ${CYAN}${branchDisplay}${RESET}${BOLD}:${RESET}\n`,
  );

  // Print commits newest first (they're already in that order from the chain traversal)
  for (const commit of commits) {
    printCommit(commit, currentBranch);
  }

  console.log(`${DIM}─────────────────────────────────${RESET}`);
  console.log(`${DIM}Total: ${commits.length} commit(s)${RESET}\n`);
}

function printCommit(commit: Commit, branchName: string | null) {
  const timestamp = new Date(commit.timestamp);
  const formattedTime = formatDate(timestamp);

  console.log(`${DIM}─────────────────────────────────${RESET}`);
  console.log(`${YELLOW}commit ${commit.id}${RESET}`);
  console.log(`${DIM}branch:${RESET}  ${branchName || "detached"}`);
  console.log(`${DIM}message:${RESET} ${commit.message}`);
  console.log(`${DIM}files:${RESET}   ${commit.files.length}`);
  console.log(`${DIM}time:${RESET}    ${formattedTime}`);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
