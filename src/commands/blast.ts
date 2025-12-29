import fs from "fs";
import path from "path";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

/**
 * Walk up the directory tree to find the .tnt directory
 * Returns the path to the project root, or null if not found
 */
function findTntRoot(startDir: string = process.cwd()): string | null {
  let current = startDir;

  while (current !== path.dirname(current)) {
    const tntDir = path.join(current, ".tnt");

    if (fs.existsSync(tntDir) && fs.statSync(tntDir).isDirectory()) {
      return current;
    }

    current = path.dirname(current);
  }

  return null;
}

/**
 * Recursively delete a directory
 */
function removeDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  fs.rmSync(dirPath, { recursive: true, force: true });
}

/**
 * Blast - Remove all TNT configuration from the project
 * Deletes .tnt/ directory and .tntignore file, preserving user files
 */
export function blast(confirmed?: string): void {
  const rootPath = findTntRoot();

  if (!rootPath) {
    console.log(`${RED}tnt: not inside a tnt repository${RESET}`);
    return;
  }

  const tntDir = path.join(rootPath, ".tnt");
  const tntIgnore = path.join(rootPath, ".tntignore");
  const tntBackup = path.join(rootPath, ".tnt.bak");

  // Safety check - require confirmation
  if (confirmed !== "--confirm" && confirmed !== "-y") {
    console.log();
    console.log(
      `${BOLD}${YELLOW}⚠ Warning: This will permanently delete all TNT data${RESET}`,
    );
    console.log();
    console.log(`${DIM}The following will be removed:${RESET}`);

    if (fs.existsSync(tntDir)) {
      console.log(`  ${RED}•${RESET} .tnt/          ${DIM}(repository data)${RESET}`);
    }

    if (fs.existsSync(tntIgnore)) {
      console.log(`  ${RED}•${RESET} .tntignore     ${DIM}(ignore patterns)${RESET}`);
    }

    if (fs.existsSync(tntBackup)) {
      console.log(`  ${RED}•${RESET} .tnt.bak/      ${DIM}(backup data)${RESET}`);
    }

    console.log();
    console.log(`${DIM}Your files will NOT be affected.${RESET}`);
    console.log();
    console.log(`${BOLD}To confirm, run:${RESET}`);
    console.log(`  ${DIM}tnt blast --confirm${RESET}`);
    console.log();
    return;
  }

  // Perform deletion
  let deleted = 0;

  if (fs.existsSync(tntDir)) {
    removeDir(tntDir);
    console.log(`${RED}Deleted${RESET} .tnt/`);
    deleted++;
  }

  if (fs.existsSync(tntIgnore)) {
    fs.unlinkSync(tntIgnore);
    console.log(`${RED}Deleted${RESET} .tntignore`);
    deleted++;
  }

  if (fs.existsSync(tntBackup)) {
    removeDir(tntBackup);
    console.log(`${RED}Deleted${RESET} .tnt.bak/`);
    deleted++;
  }

  if (deleted > 0) {
    console.log();
    console.log(`${GREEN}✓${RESET} TNT configuration removed. Your files are intact.`);
  } else {
    console.log(`${DIM}Nothing to delete.${RESET}`);
  }
}
