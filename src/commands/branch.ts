import fs from "fs";
import path from "path";
import { getTntDir, isRepo, getCurrentBranch } from "../utils/objects";

const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

export function branch(name?: string) {
  const cwd = process.cwd();
  const tntDir = getTntDir(cwd);
  const headsDir = path.join(tntDir, "refs", "heads");

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  // Ensure refs/heads directory exists
  if (!fs.existsSync(headsDir)) {
    fs.mkdirSync(headsDir, { recursive: true });
  }

  if (!name) {
    // List branches
    const currentBranch = getCurrentBranch(cwd);
    const branches = fs.readdirSync(headsDir);

    if (branches.length === 0) {
      console.log("No branches yet. Create one with: tnt -c <branch-name>");
      return;
    }

    console.log();
    for (const b of branches) {
      if (b === currentBranch) {
        console.log(`${GREEN}* ${BOLD}${b}${RESET}`);
      } else {
        console.log(`  ${b}`);
      }
    }
    console.log();
    return;
  }

  // Create new branch
  const newBranch = path.join(headsDir, name);

  if (fs.existsSync(newBranch)) {
    console.log(`tnt: branch '${name}' already exists`);
    return;
  }

  const headContent = fs
    .readFileSync(path.join(tntDir, "HEAD"), "utf-8")
    .trim();

  let currentCommit = "";

  // Check if HEAD is a ref (e.g., "ref: refs/heads/main") or a direct commit hash
  if (headContent.startsWith("ref: ")) {
    const refPath = path.join(tntDir, headContent.replace("ref: ", ""));

    if (fs.existsSync(refPath)) {
      currentCommit = fs.readFileSync(refPath, "utf-8").trim();
    }
  } else {
    // HEAD contains a direct commit hash (detached HEAD state)
    currentCommit = headContent;
  }

  fs.writeFileSync(newBranch, currentCommit);
  console.log(`Created branch '${name}'`);
}
