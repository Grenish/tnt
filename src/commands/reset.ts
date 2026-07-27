import {
  isRepo,
  getCurrentCommit,
  getCommit,
  resolveRevision,
  updateBranchCommit,
  explain,
} from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";

/**
 * Soft reset: move the current branch (or detached HEAD) to a commit
 * without touching the index or working tree.
 *
 * Usage:
 *   tnt reset --soft <rev>
 *   tnt reset --soft HEAD~1
 */
export function resetCommand(rawArgs: string[] = []) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const { soft, mixed, hard, rev, help } = parseResetArgs(rawArgs);

  if (help || (!soft && !mixed && !hard && !rev)) {
    printUsage();
    return;
  }

  if (mixed || hard) {
    console.log(
      `${YELLOW}tnt: only --soft is supported right now${RESET}`,
    );
    console.log(
      `${DIM}--mixed / --hard would change the index/worktree; use stash + checkout for recovery.${RESET}\n`,
    );
    return;
  }

  if (!soft) {
    console.log(`${YELLOW}tnt: specify --soft (only mode available)${RESET}`);
    printUsage();
    return;
  }

  const targetRev = rev || "HEAD~1";
  const targetId = resolveRevision(targetRev, cwd);

  if (!targetId) {
    console.log(`${YELLOW}tnt: unknown revision:${RESET} ${targetRev}`);
    return;
  }

  const target = getCommit(targetId, cwd);
  if (!target) {
    console.log(`${YELLOW}tnt: not a commit:${RESET} ${targetId}`);
    return;
  }

  const before = getCurrentCommit(cwd);
  updateBranchCommit(targetId, cwd);
  explain(
    `soft reset ${before ?? "(none)"} → ${targetId} (index & worktree untouched)`,
  );

  console.log(`${GREEN}✓${RESET} ${BOLD}Soft reset${RESET}`);
  console.log(`  ${DIM}HEAD was${RESET}  ${before ?? "(none)"}`);
  console.log(`  ${DIM}HEAD now${RESET}  ${CYAN}${targetId}${RESET}`);
  console.log(`  ${DIM}message${RESET}   ${target.message}`);
  console.log(
    `\n${DIM}Index and working tree were left unchanged.${RESET}`,
  );
  console.log(
    `${DIM}Stage + summ to re-commit, or summ --amend if you meant to fix the tip.${RESET}\n`,
  );
}

function parseResetArgs(rawArgs: string[]) {
  let soft = false;
  let mixed = false;
  let hard = false;
  let help = false;
  let rev: string | undefined;

  for (const a of rawArgs) {
    if (a === "--soft") soft = true;
    else if (a === "--mixed") mixed = true;
    else if (a === "--hard") hard = true;
    else if (a === "-h" || a === "--help") help = true;
    else if (!a.startsWith("-")) rev = a;
  }

  return { soft, mixed, hard, rev, help };
}

function printUsage() {
  console.log(`
${BOLD}tnt reset --soft${RESET} — move HEAD, keep worktree & index

${BOLD}Usage:${RESET}
  tnt reset --soft <rev>
  tnt reset --soft HEAD~1

${BOLD}Notes:${RESET}
  ${DIM}•${RESET} Only ${CYAN}--soft${RESET} is implemented (safe recovery).
  ${DIM}•${RESET} Does ${BOLD}not${RESET} change staged files or the working tree.
  ${DIM}•${RESET} ${YELLOW}<rev>${RESET} can be HEAD, HEAD~1, a branch, or a commit hash.

${BOLD}Examples:${RESET}
  ${DIM}$${RESET} tnt reset --soft HEAD~1
  ${DIM}$${RESET} tnt reset --soft main
`);
}
