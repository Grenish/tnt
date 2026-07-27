import {
  isRepo,
  getTree,
  getCommit,
  resolveRevision,
  readObject,
} from "../utils/objects";

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

/**
 * List entries of a tree object (or the root tree of a commit / HEAD).
 *
 * Usage: tnt ls-tree [<tree|commit|branch|HEAD>]
 */
export function lsTree(target?: string) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const rev = target || "HEAD";
  let treeHash: string | null = null;

  // Direct tree object?
  const direct = readObject(rev, cwd);
  if (direct?.type === "tree") {
    treeHash = rev;
  } else {
    const commitId = resolveRevision(rev, cwd);
    if (commitId) {
      const commit = getCommit(commitId, cwd);
      if (commit?.tree) {
        treeHash = commit.tree;
      } else if (commit && !commit.tree) {
        console.log(
          `${YELLOW}tnt: commit ${commitId} has no tree (legacy v1). Run:${RESET} tnt convert\n`,
        );
        return;
      }
    }
  }

  if (!treeHash) {
    console.log(`${YELLOW}tnt: cannot resolve tree for${RESET} ${rev}\n`);
    return;
  }

  const entries = getTree(treeHash, cwd);
  if (!entries) {
    console.log(`${YELLOW}tnt: tree not found:${RESET} ${treeHash}\n`);
    return;
  }

  console.log();
  console.log(`${DIM}tree ${treeHash}${RESET}`);
  console.log(`${DIM}────────────────────────────${RESET}`);

  for (const e of entries) {
    const typeColor = e.type === "tree" ? CYAN : GREEN;
    console.log(
      `${typeColor}${e.type.padEnd(4)}${RESET} ${e.hash}  ${e.name}`,
    );
  }

  console.log();
}
