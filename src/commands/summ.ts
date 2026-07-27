import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  getCommit,
  updateBranchCommit,
  writeTree,
  writeCommit,
  writeFormatVersion,
  explain,
} from "../utils/objects";
import type { FileEntry } from "../utils/objects";
import type { Index } from "./stage";

export interface SummOptions {
  amend?: boolean;
}

export function summ(message?: string, options: SummOptions = {}) {
  if (options.amend) {
    amendCommit(message);
    return;
  }

  createCommit(message ?? "update");
}

function createCommit(message: string) {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository (run `tnt init`)");
    return;
  }

  if (!fs.existsSync(indexPath)) {
    console.log("tnt: index not found");
    return;
  }

  const index: Index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  if (index.files.length === 0) {
    console.log("tnt: nothing to commit");
    return;
  }

  const parentCommitId = getCurrentCommit(cwd);

  const files: FileEntry[] = index.files.map((f) => ({
    path: f.path,
    hash: f.hash,
  }));

  if (parentCommitId) {
    const parent = getCommit(parentCommitId, cwd);
    if (parent) {
      const stagedPaths = new Set(files.map((f) => f.path));
      for (const parentFile of parent.files) {
        if (!stagedPaths.has(parentFile.path)) {
          files.push(parentFile);
        }
      }
      explain(
        `merged parent ${parentCommitId} snapshot (${parent.files.length} files) with ${index.files.length} staged`,
      );
    }
  }

  const tree = writeTree(files, cwd);
  const id = writeCommit(
    {
      tree,
      parent: parentCommitId || undefined,
      message,
    },
    cwd,
  );

  writeFormatVersion(2, cwd);
  fs.writeFileSync(indexPath, JSON.stringify({ files: [] }, null, 2));
  explain("cleared staging index");
  updateBranchCommit(id, cwd);

  console.log(`Committed ${index.files.length} file(s): "${message}"`);
  console.log(`  commit ${id}`);
  console.log(`  tree   ${tree}`);
}

/**
 * Replace HEAD with a new commit that has the same parent as the current HEAD.
 * - Message: provided message, or keep previous message if omitted/empty
 * - Tree: if index has staged files, merge them onto current snapshot; else keep current tree
 */
function amendCommit(message?: string) {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository (run `tnt init`)");
    return;
  }

  const headId = getCurrentCommit(cwd);
  if (!headId) {
    console.log("tnt: nothing to amend (no commits yet)");
    return;
  }

  const current = getCommit(headId, cwd);
  if (!current) {
    console.log(`tnt: cannot read commit ${headId}`);
    return;
  }

  const index: Index = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, "utf-8"))
    : { files: [] };

  let files: FileEntry[] = current.files.map((f) => ({ ...f }));
  let stagedCount = 0;

  if (index.files.length > 0) {
    const staged: FileEntry[] = index.files.map((f) => ({
      path: f.path,
      hash: f.hash,
    }));
    stagedCount = staged.length;
    const stagedPaths = new Set(staged.map((f) => f.path));
    files = [...staged];
    for (const f of current.files) {
      if (!stagedPaths.has(f.path)) {
        files.push(f);
      }
    }
    explain(`amend: applying ${stagedCount} staged file(s) onto ${headId}`);
  } else {
    explain(`amend: keeping tree from ${headId}`);
  }

  const finalMessage =
    message && message.trim().length > 0 ? message : current.message;

  const tree = writeTree(files, cwd);
  const id = writeCommit(
    {
      tree,
      parent: current.parent,
      message: finalMessage,
    },
    cwd,
  );

  writeFormatVersion(2, cwd);

  if (stagedCount > 0) {
    fs.writeFileSync(indexPath, JSON.stringify({ files: [] }, null, 2));
    explain("cleared staging index after amend");
  }

  updateBranchCommit(id, cwd);

  console.log(`Amended commit: "${finalMessage}"`);
  console.log(`  was    ${headId}`);
  console.log(`  commit ${id}`);
  console.log(`  tree   ${tree}`);
  if (current.parent) {
    console.log(`  parent ${current.parent}`);
  } else {
    console.log(`  parent (root)`);
  }
}
