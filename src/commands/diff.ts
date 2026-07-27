import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  getCommit,
  getBlob,
  collectFiles,
  hashContent,
  explain,
} from "../utils/objects";
import {
  formatUnifiedDiff,
  colorizeUnifiedDiff,
  computeLineDiff,
} from "../utils/diff";
import type { Index } from "./stage";

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";

export interface DiffCliOptions {
  /** index vs HEAD (like git diff --staged) */
  staged?: boolean;
  /** shortstat only */
  stat?: boolean;
  /** path filters (relative paths or prefixes) */
  paths?: string[];
  /** disable color even on TTY */
  noColor?: boolean;
  /** force / skip pager */
  noPager?: boolean;
  help?: boolean;
}

export interface DiffPair {
  path: string;
  oldPath: string;
  newPath: string;
  oldText: string;
  newText: string;
}

/**
 * Show diffs.
 *
 * Default (unstaged): working tree vs index
 *   (index = HEAD snapshot with staged overrides — same as Git)
 * `--staged` / `--cached`: index vs HEAD
 */
export function diffCommand(rawArgs: string[] = []) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const options = parseDiffArgs(rawArgs);

  if (options.help) {
    printUsage();
    return;
  }

  const pairs = collectDiffPairs(cwd, options);

  if (pairs.length === 0) {
    return;
  }

  if (options.stat) {
    printStat(pairs);
    return;
  }

  printPatches(pairs, {
    noColor: options.noColor,
    noPager: options.noPager,
    staged: options.staged,
  });
}

/**
 * Shared entry for `stats --patch`: print unstaged unified diffs.
 */
export function printWorkingTreePatches(cwd: string = process.cwd()) {
  const pairs = collectDiffPairs(cwd, { staged: false, paths: [] });
  if (pairs.length === 0) return;
  console.log(`\n${BOLD}Unstaged patch:${RESET}`);
  printPatches(pairs, { noPager: true });
}

function printPatches(
  pairs: DiffPair[],
  opts: { noColor?: boolean; noPager?: boolean; staged?: boolean },
) {
  const useColor =
    !opts.noColor && !!process.stdout.isTTY && process.env.NO_COLOR == null;

  let out = "";
  for (const pair of pairs) {
    const patch = formatUnifiedDiff(pair.oldText, pair.newText, {
      oldPath: pair.oldPath,
      newPath: pair.newPath,
    });
    if (!patch) continue;
    out += useColor ? colorizeUnifiedDiff(patch) : patch;
  }

  if (!out) return;

  explain(
    opts.staged
      ? "diff mode: index (staged) vs HEAD"
      : "diff mode: working tree vs index",
  );

  pageOrPrint(out, opts.noPager);
}

export function parseDiffArgs(rawArgs: string[]): DiffCliOptions {
  const options: DiffCliOptions = { paths: [] };

  for (const a of rawArgs) {
    if (a === "--staged" || a === "--cached") {
      options.staged = true;
    } else if (a === "--stat") {
      options.stat = true;
    } else if (a === "--no-color") {
      options.noColor = true;
    } else if (a === "--no-pager") {
      options.noPager = true;
    } else if (a === "-h" || a === "--help") {
      options.help = true;
    } else if (!a.startsWith("-")) {
      options.paths!.push(a);
    }
  }

  return options;
}

function printUsage() {
  console.log(`
${BOLD}tnt diff${RESET} — show changes

${BOLD}Usage:${RESET}
  tnt diff [options] [path...]
  tnt diff --staged [path...]
  tnt diff --stat [path...]

${BOLD}Options:${RESET}
  --staged, --cached   Compare index to HEAD (staged changes)
  --stat               Summary only (+/- line counts)
  --no-color           Disable ANSI colors
  --no-pager           Never open a pager

${DIM}Default compares the working tree to the index (unstaged changes).${RESET}
`);
}

export function collectDiffPairs(
  cwd: string,
  options: DiffCliOptions,
): DiffPair[] {
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");
  const index: Index = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, "utf-8"))
    : { files: [] };

  const staged = new Map<string, string>();
  for (const f of index.files) {
    staged.set(f.path, f.hash);
  }

  const head = new Map<string, string>();
  const commitId = getCurrentCommit(cwd);
  if (commitId) {
    const commit = getCommit(commitId, cwd);
    if (commit) {
      for (const f of commit.files) {
        head.set(f.path, f.hash);
      }
    }
  }

  // Index snapshot = HEAD + staged overrides
  const indexSnap = new Map<string, string>(head);
  for (const [p, h] of staged) {
    indexSnap.set(p, h);
  }

  const pathFilters = options.paths ?? [];
  const matchesFilter = (filePath: string) => {
    if (pathFilters.length === 0) return true;
    return pathFilters.some((f) => {
      const norm = f.replace(/\/$/, "");
      return filePath === norm || filePath.startsWith(norm + "/");
    });
  };

  const pairs: DiffPair[] = [];

  if (options.staged) {
    const paths = new Set([...head.keys(), ...staged.keys()]);
    for (const filePath of paths) {
      if (!matchesFilter(filePath)) continue;
      const oldHash = head.get(filePath);
      const newHash = indexSnap.get(filePath);
      if (oldHash === newHash) continue;

      const oldText = oldHash ? (getBlob(oldHash, cwd) ?? "") : "";
      const newText = newHash ? (getBlob(newHash, cwd) ?? "") : "";

      pairs.push({
        path: filePath,
        oldPath: oldHash ? `a/${filePath}` : "/dev/null",
        newPath: newHash ? `b/${filePath}` : "/dev/null",
        oldText,
        newText,
      });
    }
    return pairs.sort((a, b) => a.path.localeCompare(b.path));
  }

  // Unstaged: working tree vs index
  const working = collectFiles(cwd, cwd);
  const candidates = new Set<string>([...indexSnap.keys(), ...working]);

  for (const filePath of candidates) {
    if (!matchesFilter(filePath)) continue;

    const indexHash = indexSnap.get(filePath);
    const full = path.join(cwd, filePath);
    const exists = fs.existsSync(full) && fs.statSync(full).isFile();

    // Untracked: in worktree, not in index — skip (like git diff)
    if (!indexHash && exists) {
      continue;
    }

    // Deleted: in index, missing in worktree
    if (indexHash && !exists) {
      const oldText = getBlob(indexHash, cwd) ?? "";
      pairs.push({
        path: filePath,
        oldPath: `a/${filePath}`,
        newPath: "/dev/null",
        oldText,
        newText: "",
      });
      continue;
    }

    if (!exists || !indexHash) continue;

    const newText = fs.readFileSync(full, "utf-8");
    const newHash = hashContent(newText);
    if (newHash === indexHash) continue;

    const oldText = getBlob(indexHash, cwd) ?? "";
    pairs.push({
      path: filePath,
      oldPath: `a/${filePath}`,
      newPath: `b/${filePath}`,
      oldText,
      newText,
    });
  }

  return pairs.sort((a, b) => a.path.localeCompare(b.path));
}

function printStat(pairs: DiffPair[]) {
  let totalAdd = 0;
  let totalDel = 0;

  console.log();
  for (const p of pairs) {
    const d = computeLineDiff(p.oldText, p.newText);
    totalAdd += d.added;
    totalDel += d.removed;
    const bar =
      (d.added ? `${GREEN}+${d.added}${RESET}` : "") +
      (d.added && d.removed ? " " : "") +
      (d.removed ? `${RED}-${d.removed}${RESET}` : "");
    console.log(` ${p.path.padEnd(40)} ${bar}`);
  }
  console.log(
    `\n ${DIM}${pairs.length} file(s) changed${RESET}, ${GREEN}+${totalAdd}${RESET} ${RED}-${totalDel}${RESET}\n`,
  );
}

function pageOrPrint(text: string, noPager?: boolean) {
  const lineCount = text.split("\n").length;
  const shouldPage =
    !noPager &&
    process.stdout.isTTY &&
    lineCount > 50 &&
    process.env.TNT_PAGER !== "cat";

  if (!shouldPage) {
    process.stdout.write(text);
    return;
  }

  const pager = process.env.TNT_PAGER || process.env.PAGER || "less";
  const args = pager === "less" ? ["-R", "-F", "-X"] : [];

  const result = spawnSync(pager, args, {
    input: text,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });

  if (result.error) {
    process.stdout.write(text);
  }
}
