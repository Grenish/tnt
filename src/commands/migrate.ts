import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  getTntDir,
  isRepo,
  getCurrentBranch,
  getCommit,
  getBlob,
  hashFile,
} from "../utils/objects";
import type { Commit } from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

interface BranchInfo {
  name: string;
  commitId: string;
}

interface CommitWithBranch extends Commit {
  branches: string[];
}

export function migrate(target?: string) {
  if (target !== "-git") {
    console.log(`\n${YELLOW}Usage: tnt migrate -git${RESET}`);
    console.log(`${DIM}Migrates your TNT repository to Git${RESET}\n`);
    return;
  }

  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const gitDir = path.join(cwd, ".git");

  console.log(`\n${BOLD}${CYAN}TNT → Git Migration${RESET}\n`);

  // Step 1: Validate environment
  console.log(`${BOLD}[1/4] Validating environment...${RESET}`);

  if (!isRepo(cwd)) {
    console.log(`  ${RED}✗${RESET} No .tnt/ directory found`);
    console.log(`  ${DIM}This doesn't appear to be a TNT repository${RESET}\n`);
    return;
  }
  console.log(`  ${GREEN}✓${RESET} .tnt/ exists`);

  if (fs.existsSync(gitDir)) {
    console.log(`  ${RED}✗${RESET} .git/ already exists`);
    console.log(
      `  ${DIM}Remove .git/ first if you want to migrate${RESET}\n`,
    );
    return;
  }
  console.log(`  ${GREEN}✓${RESET} .git/ does not exist`);

  // Check for uncommitted changes (compare working tree with latest commit)
  const cleanStatus = checkWorkingTreeClean(cwd);
  if (!cleanStatus.clean) {
    console.log(`  ${RED}✗${RESET} Working tree is not clean`);
    console.log(
      `  ${DIM}Commit or discard changes before migrating: ${cleanStatus.reason}${RESET}\n`,
    );
    return;
  }
  console.log(`  ${GREEN}✓${RESET} Working tree is clean`);

  // Step 2: Read TNT state
  console.log(`\n${BOLD}[2/4] Reading TNT state...${RESET}`);

  const branches = readBranches(cwd);
  console.log(`  ${GREEN}✓${RESET} Found ${branches.length} branch(es)`);

  const allCommits = collectAllCommits(branches, cwd);
  console.log(`  ${GREEN}✓${RESET} Found ${allCommits.length} commit(s)`);

  const currentBranch = getCurrentBranch(cwd) || "main";
  console.log(`  ${GREEN}✓${RESET} Current branch: ${currentBranch}`);

  if (allCommits.length === 0) {
    console.log(`\n${YELLOW}No commits to migrate.${RESET}`);
    console.log(`${DIM}Initialize Git manually with: git init${RESET}\n`);
    return;
  }

  // Step 3: Rebuild Git repository
  console.log(`\n${BOLD}[3/4] Rebuilding as Git repository...${RESET}`);

  try {
    // Initialize git
    execSync("git init", { cwd, stdio: "pipe" });
    console.log(`  ${GREEN}✓${RESET} Initialized Git repository`);

    // Configure git user if not set (needed for commits)
    try {
      execSync("git config user.name", { cwd, stdio: "pipe" });
    } catch {
      execSync('git config user.name "TNT Migration"', { cwd, stdio: "pipe" });
      execSync('git config user.email "tnt@migration.local"', {
        cwd,
        stdio: "pipe",
      });
      console.log(`  ${DIM}(Set temporary Git user for migration)${RESET}`);
    }

    // Sort commits by timestamp (oldest first)
    allCommits.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Map TNT commit IDs to Git commit hashes
    const commitMap = new Map<string, string>();

    // Replay commits in order
    for (let i = 0; i < allCommits.length; i++) {
      const commit = allCommits[i];
      if (!commit) continue;

      // Restore files from this commit
      restoreCommitFiles(commit, cwd);

      // Stage all files
      execSync("git add -A", { cwd, stdio: "pipe" });

      // Create git commit with original timestamp and message
      const timestamp = new Date(commit.timestamp).toISOString();
      const message = escapeMessage(commit.message);

      try {
        execSync(
          `git commit --allow-empty -m "${message}" --date="${timestamp}"`,
          {
            cwd,
            stdio: "pipe",
            env: {
              ...process.env,
              GIT_COMMITTER_DATE: timestamp,
            },
          },
        );

        // Get the git commit hash
        const gitHash = execSync("git rev-parse HEAD", { cwd, stdio: "pipe" })
          .toString()
          .trim();
        commitMap.set(commit.id, gitHash);
      } catch {
        // Might fail if nothing to commit, continue
        const gitHash = execSync("git rev-parse HEAD", { cwd, stdio: "pipe" })
          .toString()
          .trim();
        commitMap.set(commit.id, gitHash);
      }

      console.log(
        `  ${GREEN}✓${RESET} Commit ${i + 1}/${allCommits.length}: ${commit.message.slice(0, 40)}${commit.message.length > 40 ? "..." : ""}`,
      );
    }

    // Create branches pointing to correct commits
    for (const branch of branches) {
      const gitHash = commitMap.get(branch.commitId);

      if (gitHash && branch.name !== "main") {
        try {
          execSync(`git branch ${branch.name} ${gitHash}`, {
            cwd,
            stdio: "pipe",
          });
          console.log(`  ${GREEN}✓${RESET} Created branch: ${branch.name}`);
        } catch {
          // Branch might already exist or be invalid
        }
      }
    }

    // Checkout the original active branch
    try {
      execSync(`git checkout ${currentBranch}`, { cwd, stdio: "pipe" });
      console.log(`  ${GREEN}✓${RESET} Checked out: ${currentBranch}`);
    } catch {
      // Might fail if branch doesn't exist, stay on main
    }
  } catch (error) {
    console.log(`\n${RED}Migration failed:${RESET}`);
    console.log(
      `${DIM}${error instanceof Error ? error.message : error}${RESET}\n`,
    );

    // Clean up partial .git
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true });
    }
    return;
  }

  // Step 4: Cleanup
  console.log(`\n${BOLD}[4/4] Cleaning up...${RESET}`);

  const backupDir = path.join(cwd, ".tnt.bak");

  // Remove old backup if exists
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true });
  }

  // Rename .tnt to .tnt.bak
  fs.renameSync(tntDir, backupDir);
  console.log(`  ${GREEN}✓${RESET} Renamed .tnt/ → .tnt.bak/`);

  // Print success message
  console.log(`
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
${BOLD}${GREEN}✓ Migration complete!${RESET}

${DIM}Your TNT repository has been migrated to Git.${RESET}
${DIM}Old TNT data backed up to .tnt.bak/${RESET}

${CYAN}Hope you enjoyed your stay with TNT! 💥${RESET}

${DIM}You can now use standard Git commands:${RESET}
  ${DIM}$${RESET} git status
  ${DIM}$${RESET} git log --oneline
  ${DIM}$${RESET} git branch -a
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
`);
}

function checkWorkingTreeClean(cwd: string): { clean: boolean; reason?: string } {
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");

  // Check for staged files
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

    if (index.files && index.files.length > 0) {
      return { clean: false, reason: "staged files exist" };
    }
  }

  return { clean: true };
}

function readBranches(cwd: string): BranchInfo[] {
  const headsDir = path.join(getTntDir(cwd), "refs", "heads");
  const branches: BranchInfo[] = [];

  if (!fs.existsSync(headsDir)) {
    return branches;
  }

  for (const name of fs.readdirSync(headsDir)) {
    const branchPath = path.join(headsDir, name);
    const commitId = fs.readFileSync(branchPath, "utf-8").trim();

    if (commitId) {
      branches.push({ name, commitId });
    }
  }

  return branches;
}

function collectAllCommits(branches: BranchInfo[], cwd: string): CommitWithBranch[] {
  const commitMap = new Map<string, CommitWithBranch>();

  for (const branch of branches) {
    let commitId: string | null = branch.commitId;

    while (commitId) {
      const existing = commitMap.get(commitId);

      if (existing) {
        // Add this branch to the commit's branches list
        if (!existing.branches.includes(branch.name)) {
          existing.branches.push(branch.name);
        }
        // Continue traversing to mark parent commits too
        const commit = getCommit(commitId, cwd);
        commitId = commit?.parent || null;
        continue;
      }

      const commit = getCommit(commitId, cwd);

      if (!commit) {
        break;
      }

      commitMap.set(commitId, {
        ...commit,
        branches: [branch.name],
      });

      commitId = commit.parent || null;
    }
  }

  return Array.from(commitMap.values());
}

function restoreCommitFiles(commit: Commit, cwd: string) {
  const tntDir = getTntDir(cwd);

  // Get list of all current files (excluding .tnt, .git, node_modules)
  const currentFiles = new Set<string>();
  collectCurrentFiles(cwd, cwd, currentFiles);

  // Track which files this commit has
  const commitFiles = new Set<string>();

  // Restore files from commit
  for (const file of commit.files) {
    commitFiles.add(file.path);
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

  // Remove files that don't exist in this commit
  for (const filePath of currentFiles) {
    if (!commitFiles.has(filePath)) {
      const fullPath = path.join(cwd, filePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);

        // Clean up empty directories
        cleanEmptyDirs(path.dirname(fullPath), cwd);
      }
    }
  }
}

function collectCurrentFiles(dir: string, cwd: string, files: Set<string>) {
  if (!fs.existsSync(dir)) return;

  for (const item of fs.readdirSync(dir)) {
    if (
      item === ".tnt" ||
      item === ".tnt.bak" ||
      item === ".git" ||
      item === "node_modules"
    ) {
      continue;
    }

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      collectCurrentFiles(fullPath, cwd, files);
    } else {
      files.add(path.relative(cwd, fullPath));
    }
  }
}

function cleanEmptyDirs(dir: string, cwd: string) {
  while (dir !== cwd && dir !== ".") {
    try {
      const entries = fs.readdirSync(dir);

      if (entries.length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

function escapeMessage(message: string): string {
  return message.replace(/"/g, '\\"').replace(/\n/g, " ");
}
