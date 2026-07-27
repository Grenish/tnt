import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getFormatVersion,
  writeFormatVersion,
  getCommit,
  storeBlob,
  writeTree,
  writeCommit,
  listAllCommits,
  getBlob,
  readObject,
} from "../utils/objects";
import type { Commit, FileEntry } from "../utils/objects";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

/**
 * Convert a legacy v1 repo (timestamp commits + flat files + raw blobs)
 * into format 2 (typed objects, trees, content-addressed commits).
 *
 * Usage: tnt convert
 */
export function convert() {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const version = getFormatVersion(cwd);
  console.log(`\n${BOLD}TNT convert → format 2${RESET}`);
  console.log(`${DIM}Current format marker: ${version}${RESET}\n`);

  // Collect legacy commits (JSON) and any already-v2
  const legacyDir = path.join(getTntDir(cwd), "commits");
  const legacyIds: string[] = [];

  if (fs.existsSync(legacyDir)) {
    for (const f of fs.readdirSync(legacyDir)) {
      if (f.endsWith(".json")) {
        legacyIds.push(f.replace(/\.json$/, ""));
      }
    }
  }

  if (legacyIds.length === 0) {
    // Ensure blobs are typed? If already v2 commits only:
    const all = listAllCommits(cwd);
    const needsTree = all.some((c) => !c.tree);
    if (!needsTree) {
      writeFormatVersion(2, cwd);
      console.log(
        `${GREEN}✓${RESET} Nothing to convert (already format 2 or empty).\n`,
      );
      return;
    }
  }

  // Load legacy commits
  const legacyCommits: Commit[] = [];
  for (const id of legacyIds) {
    const c = getCommit(id, cwd);
    if (c) legacyCommits.push(c);
  }

  // Oldest first for parent remapping
  legacyCommits.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const idMap = new Map<string, string>(); // old → new
  const blobMap = new Map<string, string>(); // old blob hash → new

  function remapBlob(oldHash: string): string {
    if (blobMap.has(oldHash)) return blobMap.get(oldHash)!;

    // Already a v2 blob?
    const existing = readObject(oldHash, cwd);
    if (existing?.type === "blob") {
      // Check if payload is typed (v2) by re-storing content
      const content = existing.content;
      // If oldHash equals store of content as v2, it's already v2
      const fresh = storeBlob(content, cwd);
      blobMap.set(oldHash, fresh);
      return fresh;
    }

    // v1 raw file
    const content = getBlob(oldHash, cwd);
    if (content === null) {
      console.log(
        `${YELLOW}warn:${RESET} missing blob ${oldHash}, skipping remap`,
      );
      blobMap.set(oldHash, oldHash);
      return oldHash;
    }
    const fresh = storeBlob(content, cwd);
    blobMap.set(oldHash, fresh);
    return fresh;
  }

  console.log(`${BOLD}Converting ${legacyCommits.length} legacy commit(s)...${RESET}\n`);

  for (const old of legacyCommits) {
    if (old.tree && readObject(old.id, cwd)?.type === "commit") {
      idMap.set(old.id, old.id);
      continue;
    }

    const files: FileEntry[] = old.files.map((f) => ({
      path: f.path,
      hash: remapBlob(f.hash),
    }));

    const tree = writeTree(files, cwd);
    const parent = old.parent ? idMap.get(old.parent) || old.parent : undefined;
    const newId = writeCommit(
      {
        tree,
        parent,
        message: old.message,
        timestamp: old.timestamp,
      },
      cwd,
    );
    idMap.set(old.id, newId);
    console.log(
      `  ${DIM}${old.id}${RESET} → ${CYAN}${newId}${RESET}  ${old.message.slice(0, 40)}`,
    );
  }

  // Rewrite branch refs
  const headsDir = path.join(getTntDir(cwd), "refs", "heads");
  if (fs.existsSync(headsDir)) {
    for (const name of fs.readdirSync(headsDir)) {
      const p = path.join(headsDir, name);
      const tip = fs.readFileSync(p, "utf-8").trim();
      if (tip && idMap.has(tip)) {
        fs.writeFileSync(p, idMap.get(tip)!);
        console.log(
          `  ${GREEN}ref${RESET} ${name}: ${tip} → ${idMap.get(tip)}`,
        );
      }
    }
  }

  // Detached HEAD
  const headPath = path.join(getTntDir(cwd), "HEAD");
  const head = fs.readFileSync(headPath, "utf-8").trim();
  if (!head.startsWith("ref: ") && idMap.has(head)) {
    fs.writeFileSync(headPath, idMap.get(head)!);
  }

  // Archive legacy commit JSON
  if (fs.existsSync(legacyDir) && legacyIds.length > 0) {
    const bak = path.join(getTntDir(cwd), "commits.bak");
    if (fs.existsSync(bak)) {
      fs.rmSync(bak, { recursive: true, force: true });
    }
    fs.renameSync(legacyDir, bak);
    console.log(
      `\n  ${DIM}archived legacy commits/ → .tnt/commits.bak${RESET}`,
    );
  }

  writeFormatVersion(2, cwd);
  console.log(`\n${GREEN}✓${RESET} Converted to format 2 (${idMap.size} commits).\n`);
}
