import { isRepo, resolveRevision, getCurrentBranch } from "../utils/objects";

const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

/**
 * Resolve a revision to a commit id (or print HEAD / branch tips).
 *
 * Usage:
 *   tnt rev-parse HEAD
 *   tnt rev-parse main
 *   tnt rev-parse <prefix>
 */
export function revParse(target?: string) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const rev = target || "HEAD";

  if (rev === "--abbrev-ref" || rev === "HEAD --abbrev-ref") {
    // not supported as multi-arg; handle bare branch name request
  }

  // Special: show current branch name
  if (rev === "--abbrev-ref=HEAD" || rev === "@") {
    const branch = getCurrentBranch(cwd);
    if (branch) {
      console.log(branch);
    } else {
      console.log("HEAD");
    }
    return;
  }

  const id = resolveRevision(rev, cwd);
  if (!id) {
    console.log(`${YELLOW}tnt: unknown revision:${RESET} ${rev}`);
    console.log(`${DIM}try HEAD, a branch name, or a commit hash${RESET}`);
    return;
  }

  console.log(id);
}
