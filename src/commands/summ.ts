import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  updateBranchCommit,
} from "../utils/objects";
import type { FileEntry, Commit } from "../utils/objects";
import type { Index } from "./stage";

export function summ(message = "update") {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const indexPath = path.join(tntDir, "index.json");
  const commitsDir = path.join(tntDir, "commits");

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

  if (!fs.existsSync(commitsDir)) {
    fs.mkdirSync(commitsDir, { recursive: true });
  }

  const parentCommit = getCurrentCommit(cwd);

  const id = Date.now().toString();

  // Convert staged files to commit file entries
  const files: FileEntry[] = index.files.map((f) => ({
    path: f.path,
    hash: f.hash,
  }));

  // If there's a parent commit, merge its files with staged files
  // (staged files override parent files with same path)
  if (parentCommit) {
    const parentCommitPath = path.join(commitsDir, `${parentCommit}.json`);

    if (fs.existsSync(parentCommitPath)) {
      const parent: Commit = JSON.parse(
        fs.readFileSync(parentCommitPath, "utf-8"),
      );

      // Add parent files that aren't being overwritten
      const stagedPaths = new Set(files.map((f) => f.path));

      for (const parentFile of parent.files) {
        if (!stagedPaths.has(parentFile.path)) {
          files.push(parentFile);
        }
      }
    }
  }

  const commit: Commit = {
    id,
    timestamp: new Date().toISOString(),
    message,
    files,
    parent: parentCommit || undefined,
  };

  fs.writeFileSync(
    path.join(commitsDir, `${id}.json`),
    JSON.stringify(commit, null, 2),
  );

  // Clear staging area
  fs.writeFileSync(indexPath, JSON.stringify({ files: [] }, null, 2));

  // Update current branch to point to new commit
  updateBranchCommit(id, cwd);

  console.log(`Committed ${index.files.length} file(s): "${message}"`);
}
