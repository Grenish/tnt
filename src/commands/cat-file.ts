import {
  isRepo,
  readObject,
  resolveRevision,
  getCommit,
} from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

/**
 * Inspect a stored object by hash (or resolve commit-ish then show commit).
 *
 * Usage:
 *   tnt cat-file <hash>
 *   tnt cat-file -t <hash>     # type only
 *   tnt cat-file -p <hash>     # pretty-print content
 */
export function catFile(args: string[] = []) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  let mode: "full" | "type" | "pretty" = "full";
  const positional: string[] = [];

  for (const a of args) {
    if (a === "-t" || a === "--type") {
      mode = "type";
    } else if (a === "-p" || a === "--pretty") {
      mode = "pretty";
    } else if (!a.startsWith("-")) {
      positional.push(a);
    }
  }

  const id = positional[0];
  if (!id) {
    console.log(`\n${YELLOW}Usage:${RESET} tnt cat-file [-t|-p] <hash>\n`);
    return;
  }

  // Allow branch/HEAD → commit object
  let hash = id;
  const resolved = resolveRevision(id, cwd);
  if (resolved && !readObject(id, cwd)) {
    hash = resolved;
  }

  const obj = readObject(hash, cwd);
  if (!obj) {
    // try as commit id via getCommit (legacy)
    const commit = getCommit(hash, cwd);
    if (commit) {
      if (mode === "type") {
        console.log("commit");
        return;
      }
      printCommitPretty(commit);
      return;
    }
    console.log(`${YELLOW}tnt: object not found:${RESET} ${id}`);
    return;
  }

  if (mode === "type") {
    console.log(obj.type);
    return;
  }

  if (mode === "pretty" || mode === "full") {
    console.log(`${DIM}type:${RESET}  ${CYAN}${obj.type}${RESET}`);
    console.log(`${DIM}hash:${RESET}  ${hash}`);
    console.log(`${DIM}─────${RESET}`);
    if (obj.type === "commit") {
      const c = getCommit(hash, cwd);
      if (c) {
        printCommitPretty(c);
        return;
      }
    }
    process.stdout.write(obj.content);
    if (!obj.content.endsWith("\n")) {
      process.stdout.write("\n");
    }
  }
}

function printCommitPretty(commit: {
  id: string;
  tree?: string;
  parent?: string;
  timestamp: string;
  message: string;
  files: { path: string }[];
}) {
  console.log(`${BOLD}commit${RESET} ${commit.id}`);
  if (commit.tree) console.log(`${DIM}tree${RESET} ${commit.tree}`);
  if (commit.parent) console.log(`${DIM}parent${RESET} ${commit.parent}`);
  console.log(`${DIM}date${RESET} ${commit.timestamp}`);
  console.log();
  console.log(`    ${commit.message}`);
  console.log();
  console.log(`${DIM}${commit.files.length} file(s) in tree${RESET}`);
}
