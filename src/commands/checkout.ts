import fs from "fs";
import path from "path";
import {
  getTntDir,
  isRepo,
  getCurrentCommit,
  getCommit,
  getBlob,
  collectFiles,
} from "../utils/objects";

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

  // Get the commit the target branch points to
  const targetCommitId = fs.readFileSync(branchPath, "utf-8").trim();

  // Get current commit to compare
  const currentCommitId = getCurrentCommit(cwd);

  // If we're already at this commit, just update HEAD
  if (currentCommitId === targetCommitId) {
    fs.writeFileSync(path.join(tntDir, "HEAD"), `ref: refs/heads/${branch}`);
    console.log(`Switched to branch '${branch}'`);
    return;
  }

  // Get the target commit's files
  let targetFiles: Map<string, string> = new Map();

  if (targetCommitId) {
    const targetCommit = getCommit(targetCommitId, cwd);

    if (targetCommit) {
      for (const file of targetCommit.files) {
        targetFiles.set(file.path, file.hash);
      }
    }
  }

  // Get current commit's files for comparison
  let currentFiles: Map<string, string> = new Map();

  if (currentCommitId) {
    const currentCommit = getCommit(currentCommitId, cwd);

    if (currentCommit) {
      for (const file of currentCommit.files) {
        currentFiles.set(file.path, file.hash);
      }
    }
  }

  // Restore files from target commit
  for (const [filePath, hash] of targetFiles) {
    const content = getBlob(hash, cwd);

    if (content !== null) {
      const fullPath = path.join(cwd, filePath);
      const dir = path.dirname(fullPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
    }
  }

  // Remove files that exist in current commit but not in target commit
  for (const [filePath] of currentFiles) {
    if (!targetFiles.has(filePath)) {
      const fullPath = path.join(cwd, filePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);

        // Clean up empty directories
        let dir = path.dirname(fullPath);

        while (dir !== cwd && dir !== ".") {
          try {
            const entries = fs.readdirSync(dir);

            if (entries.length === 0) {
              fs.rmdirSync(dir);
              dir = path.dirname(dir);
            } else {
              break;
            }
          } catch {
            break;
          }
        }
      }
    }
  }

  // Update HEAD to point to the new branch
  fs.writeFileSync(path.join(tntDir, "HEAD"), `ref: refs/heads/${branch}`);

  console.log(`Switched to branch '${branch}'`);
}
