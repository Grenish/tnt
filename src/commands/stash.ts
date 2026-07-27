import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  getCurrentBranch,
  getCommit,
  storeBlob,
  writeTree,
  flattenTreeToFiles,
  hashContent,
  explain,
  explainObject,
} from "../utils/objects";
import { restoreFileMap, fileEntriesToMap } from "../utils/worktree";
import type { FileEntry } from "../utils/objects";
import type { Index } from "./stage";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

interface StashEntry {
  message: string;
  timestamp: string;
  head: string | null;
  tree: string;
  index: FileEntry[];
}

interface StashFile {
  entries: StashEntry[];
}

const SUBCOMMANDS = new Set([
  "push",
  "save",
  "list",
  "ls",
  "apply",
  "pop",
  "drop",
  "clear",
  "show",
  "help",
]);

/**
 * Stash subcommands: push (default), list, apply, pop, drop, clear, show
 */
export function stashCommand(rawArgs: string[] = []) {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  if (rawArgs.length === 0) {
    stashPush(cwd, undefined);
    return;
  }

  const [sub, ...rest] = rawArgs;
  const cmd = (sub ?? "").toLowerCase();

  if (cmd === "-h" || cmd === "--help" || cmd === "help") {
    printUsage();
    return;
  }

  if (cmd === "push" || cmd === "save") {
    stashPush(cwd, parseMessage(rest));
    return;
  }

  if (cmd === "list" || cmd === "ls") {
    stashList(cwd);
    return;
  }

  if (cmd === "apply") {
    stashApply(cwd, parseIndex(rest[0]), false);
    return;
  }

  if (cmd === "pop") {
    stashApply(cwd, parseIndex(rest[0]), true);
    return;
  }

  if (cmd === "drop") {
    stashDrop(cwd, parseIndex(rest[0]));
    return;
  }

  if (cmd === "clear") {
    stashClear(cwd);
    return;
  }

  if (cmd === "show") {
    stashShow(cwd, parseIndex(rest[0]));
    return;
  }

  // `tnt stash -m msg` or `tnt stash free form message`
  if (cmd === "-m") {
    stashPush(cwd, rest.join(" ") || undefined);
    return;
  }

  if (!SUBCOMMANDS.has(cmd) && !cmd.startsWith("-")) {
    stashPush(cwd, rawArgs.join(" "));
    return;
  }

  printUsage();
}

function parseMessage(args: string[]): string | undefined {
  if (args.length === 0) return undefined;
  if (args[0] === "-m") {
    return args.slice(1).join(" ") || undefined;
  }
  return args.join(" ") || undefined;
}

function parseIndex(token?: string): number {
  if (!token) return 0;
  const m = /^(?:stash@\{)?(\d+)\}?$/.exec(token);
  if (m) return parseInt(m[1]!, 10);
  const n = parseInt(token, 10);
  return Number.isFinite(n) ? n : 0;
}

function stashPath(cwd: string): string {
  return path.join(getTntDir(cwd), "stash.json");
}

function loadStash(cwd: string): StashFile {
  const p = stashPath(cwd);
  if (!fs.existsSync(p)) return { entries: [] };
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as StashFile;
  } catch {
    return { entries: [] };
  }
}

function saveStash(cwd: string, data: StashFile) {
  fs.writeFileSync(stashPath(cwd), JSON.stringify(data, null, 2));
}

function loadIndex(cwd: string): Index {
  const indexPath = path.join(getTntDir(cwd), "index.json");
  if (!fs.existsSync(indexPath)) return { files: [] };
  return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
}

function writeIndex(cwd: string, index: Index) {
  fs.writeFileSync(
    path.join(getTntDir(cwd), "index.json"),
    JSON.stringify(index, null, 2),
  );
}

function headFileMap(cwd: string): Map<string, string> {
  const map = new Map<string, string>();
  const head = getCurrentCommit(cwd);
  if (!head) return map;
  const commit = getCommit(head, cwd);
  if (!commit) return map;
  for (const f of commit.files) map.set(f.path, f.hash);
  return map;
}

/**
 * Build WIP snapshot: for every tracked path (HEAD ∪ index), use worktree
 * content if present (hash+blob), omit if deleted on disk.
 */
function captureWipFiles(cwd: string): FileEntry[] {
  const head = headFileMap(cwd);
  const index = loadIndex(cwd);
  const paths = new Set<string>([...head.keys()]);
  for (const f of index.files) paths.add(f.path);

  const files: FileEntry[] = [];

  for (const filePath of paths) {
    const full = path.join(cwd, filePath);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      continue;
    }
    const content = fs.readFileSync(full, "utf-8");
    const hash = storeBlob(content, cwd);
    files.push({ path: filePath, hash });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function isDirty(cwd: string): boolean {
  const head = headFileMap(cwd);
  const index = loadIndex(cwd);
  if (index.files.length > 0) return true;

  for (const filePath of head.keys()) {
    const full = path.join(cwd, filePath);
    const headHash = head.get(filePath);
    if (!fs.existsSync(full)) {
      if (headHash) return true;
      continue;
    }
    const content = fs.readFileSync(full, "utf-8");
    if (hashContent(content) !== headHash) return true;
  }
  return false;
}

function stashPush(cwd: string, message?: string) {
  if (!isDirty(cwd)) {
    console.log(`${DIM}No local changes to save${RESET}`);
    return;
  }

  const headId = getCurrentCommit(cwd);
  const branch = getCurrentBranch(cwd);
  const head = headId ? getCommit(headId, cwd) : null;
  const index = loadIndex(cwd);

  const wipFiles = captureWipFiles(cwd);
  if (wipFiles.length === 0 && index.files.length === 0) {
    console.log(`${DIM}No local changes to save${RESET}`);
    return;
  }

  const tree = writeTree(wipFiles, cwd);

  const defaultMsg = head
    ? `WIP on ${branch ?? "detached"}: ${headId?.slice(0, 8)} ${head.message}`
    : `WIP on ${branch ?? "detached"} (no commits)`;

  const entry: StashEntry = {
    message: message?.trim() || defaultMsg,
    timestamp: new Date().toISOString(),
    head: headId,
    tree,
    index: index.files.map((f) => ({ path: f.path, hash: f.hash })),
  };

  const data = loadStash(cwd);
  data.entries.unshift(entry);
  saveStash(cwd, data);
  explainObject("stash", tree, entry.message);

  const headMap = headFileMap(cwd);
  const previous = fileEntriesToMap(wipFiles);
  for (const f of index.files) {
    if (!previous.has(f.path)) previous.set(f.path, f.hash);
  }
  restoreFileMap(headMap, previous, cwd);
  writeIndex(cwd, { files: [] });

  console.log(`${GREEN}✓${RESET} Saved working directory and index`);
  console.log(`  ${DIM}stash@{0}:${RESET} ${entry.message}`);
  console.log(`  ${DIM}tree${RESET} ${tree}`);
}

function stashList(cwd: string) {
  const data = loadStash(cwd);
  if (data.entries.length === 0) {
    console.log(`${DIM}No stash entries${RESET}`);
    return;
  }

  console.log();
  data.entries.forEach((e, i) => {
    console.log(
      `${CYAN}stash@{${i}}${RESET}: ${e.message} ${DIM}(${e.timestamp.slice(0, 10)})${RESET}`,
    );
  });
  console.log();
}

function stashApply(cwd: string, index: number, pop: boolean) {
  const data = loadStash(cwd);
  const entry = data.entries[index];

  if (!entry) {
    console.log(`${RED}tnt: stash@{${index}} not found${RESET}`);
    return;
  }

  const stashFiles = flattenTreeToFiles(entry.tree, cwd);
  const stashMap = fileEntriesToMap(stashFiles);
  restoreFileMap(stashMap, new Map(), cwd);
  writeIndex(cwd, { files: entry.index });

  console.log(
    `${GREEN}✓${RESET} Applied ${CYAN}stash@{${index}}${RESET}: ${entry.message}`,
  );
  explain(
    `restored ${stashFiles.length} file(s), index entries: ${entry.index.length}`,
  );

  if (pop) {
    data.entries.splice(index, 1);
    saveStash(cwd, data);
    console.log(`${DIM}Dropped stash@{${index}}${RESET}`);
  }
}

function stashDrop(cwd: string, index: number) {
  const data = loadStash(cwd);
  if (!data.entries[index]) {
    console.log(`${RED}tnt: stash@{${index}} not found${RESET}`);
    return;
  }
  const [removed] = data.entries.splice(index, 1);
  saveStash(cwd, data);
  console.log(
    `${GREEN}✓${RESET} Dropped ${CYAN}stash@{${index}}${RESET}: ${removed!.message}`,
  );
}

function stashClear(cwd: string) {
  const data = loadStash(cwd);
  const n = data.entries.length;
  saveStash(cwd, { entries: [] });
  console.log(
    `${GREEN}✓${RESET} Cleared ${n} stash entr${n === 1 ? "y" : "ies"}`,
  );
}

function stashShow(cwd: string, index: number) {
  const data = loadStash(cwd);
  const entry = data.entries[index];
  if (!entry) {
    console.log(`${RED}tnt: stash@{${index}} not found${RESET}`);
    return;
  }

  const files = flattenTreeToFiles(entry.tree, cwd);
  console.log();
  console.log(`${BOLD}stash@{${index}}${RESET}: ${entry.message}`);
  console.log(`${DIM}when${RESET}  ${entry.timestamp}`);
  console.log(`${DIM}head${RESET}  ${entry.head ?? "(none)"}`);
  console.log(`${DIM}tree${RESET}  ${entry.tree}`);
  console.log(`${DIM}index${RESET} ${entry.index.length} staged path(s)`);
  console.log(`${DIM}files${RESET} ${files.length}`);
  for (const f of files.slice(0, 20)) {
    console.log(`  ${f.path}`);
  }
  if (files.length > 20) {
    console.log(`  ${DIM}… +${files.length - 20} more${RESET}`);
  }
  console.log();
}

function printUsage() {
  console.log(`
${BOLD}tnt stash${RESET} — park WIP changes

${BOLD}Usage:${RESET}
  tnt stash                 ${DIM}# push (default)${RESET}
  tnt stash push [message]
  tnt stash list
  tnt stash apply [n]       ${DIM}# default n=0${RESET}
  tnt stash pop [n]
  tnt stash drop [n]
  tnt stash show [n]
  tnt stash clear

${BOLD}Notes:${RESET}
  ${DIM}•${RESET} Saves tracked worktree + index, then resets both to HEAD.
  ${DIM}•${RESET} Untracked files are left alone (not stashed).
  ${DIM}•${RESET} Stack is ${CYAN}.tnt/stash.json${RESET}; newest is ${CYAN}stash@{0}${RESET}.
`);
}
