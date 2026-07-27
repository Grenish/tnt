import {
  isRepo,
  getCurrentCommit,
  getCurrentBranch,
  listAllCommits,
  getTntDir,
} from "../utils/objects";
import fs from "fs";
import path from "path";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

/**
 * Print a simple ASCII parent graph of commits (newest first per chain).
 * Marks branch tips and current HEAD.
 */
export function graph() {
  const cwd = process.cwd();

  if (!isRepo(cwd)) {
    console.log("tnt: not a repository");
    return;
  }

  const current = getCurrentCommit(cwd);
  const currentBranch = getCurrentBranch(cwd);
  const tips = readBranchTips(cwd);
  const commits = listAllCommits(cwd);

  if (commits.length === 0) {
    console.log("\nNo commits yet.\n");
    return;
  }

  // children map for simple visualization: parent -> children
  const children = new Map<string, string[]>();
  for (const c of commits) {
    if (c.parent) {
      const list = children.get(c.parent) || [];
      list.push(c.id);
      children.set(c.parent, list);
    }
  }

  console.log(`\n${BOLD}Commit graph${RESET}`);
  if (currentBranch) {
    console.log(`${DIM}HEAD → ${CYAN}${currentBranch}${RESET}\n`);
  } else {
    console.log(`${DIM}HEAD detached${RESET}\n`);
  }

  for (const commit of commits) {
    const isHead = commit.id === current;
    const tipNames = tips.get(commit.id) || [];
    const mark = isHead ? `${GREEN}*${RESET}` : `${DIM}o${RESET}`;
    const labels = [
      ...tipNames.map((b) =>
        b === currentBranch
          ? `${GREEN}(${b})${RESET}`
          : `${CYAN}(${b})${RESET}`,
      ),
      isHead && !tipNames.includes(currentBranch || "")
        ? `${GREEN}(HEAD)${RESET}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    console.log(
      `${mark} ${YELLOW}${commit.id}${RESET} ${labels}`.trimEnd(),
    );
    console.log(`  ${DIM}${commit.message}${RESET}`);
    if (commit.parent) {
      console.log(`  ${DIM}└─ parent ${commit.parent}${RESET}`);
    } else {
      console.log(`  ${DIM}└─ (root)${RESET}`);
    }
  }

  console.log(`\n${DIM}Total: ${commits.length} commit(s)${RESET}\n`);
}

function readBranchTips(cwd: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const heads = path.join(getTntDir(cwd), "refs", "heads");
  if (!fs.existsSync(heads)) return map;

  for (const name of fs.readdirSync(heads)) {
    const id = fs.readFileSync(path.join(heads, name), "utf-8").trim();
    if (!id) continue;
    const list = map.get(id) || [];
    list.push(name);
    map.set(id, list);
  }
  return map;
}
