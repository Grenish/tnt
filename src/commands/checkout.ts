import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  getCommit,
} from "../utils/objects";
import { restoreFileMap } from "../utils/worktree";

export function checkout(branch?: string) {
  if (!branch) {
    console.log("tnt: branch name required");
    return;
  }

  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const branchPath = path.join(tntDir, "refs", "heads", branch);

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  if (!fs.existsSync(branchPath)) {
    console.log(`tnt: branch '${branch}' does not exist`);
    return;
  }

  const targetCommitId = fs.readFileSync(branchPath, "utf-8").trim();
  const currentCommitId = getCurrentCommit(cwd);

  if (currentCommitId === targetCommitId) {
    fs.writeFileSync(path.join(tntDir, "HEAD"), `ref: refs/heads/${branch}`);
    console.log(`Switched to branch '${branch}'`);
    return;
  }

  const targetFiles = new Map<string, string>();
  if (targetCommitId) {
    const targetCommit = getCommit(targetCommitId, cwd);
    if (targetCommit) {
      for (const file of targetCommit.files) {
        targetFiles.set(file.path, file.hash);
      }
    }
  }

  const currentFiles = new Map<string, string>();
  if (currentCommitId) {
    const currentCommit = getCommit(currentCommitId, cwd);
    if (currentCommit) {
      for (const file of currentCommit.files) {
        currentFiles.set(file.path, file.hash);
      }
    }
  }

  restoreFileMap(targetFiles, currentFiles, cwd);

  fs.writeFileSync(path.join(tntDir, "HEAD"), `ref: refs/heads/${branch}`);
  console.log(`Switched to branch '${branch}'`);
}
