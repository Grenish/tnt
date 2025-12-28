import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

const PACKAGE_NAME = "@grenishrai/tnt";

export function upgrade(): void {
  console.log(`\n${BOLD}Checking for updates...${RESET}\n`);

  const currentVersion = getCurrentVersion();
  const latestVersion = getLatestVersion();

  if (!currentVersion) {
    console.log(`${RED}Could not determine current version${RESET}\n`);
    return;
  }

  if (!latestVersion) {
    console.log(`${YELLOW}Could not fetch latest version from npm${RESET}`);
    console.log(
      `${DIM}Package may not be published yet, or check your internet connection${RESET}\n`,
    );
    console.log(`  Current version: ${CYAN}${currentVersion}${RESET}\n`);
    return;
  }

  console.log(`  Current version: ${CYAN}${currentVersion}${RESET}`);
  console.log(`  Latest version:  ${CYAN}${latestVersion}${RESET}\n`);

  if (currentVersion === latestVersion) {
    console.log(`${GREEN}✓${RESET} You're on the latest version!\n`);
    return;
  }

  if (isNewerVersion(latestVersion, currentVersion)) {
    console.log(`${YELLOW}⬆${RESET} A new version is available!\n`);
    console.log(`${BOLD}To upgrade, run:${RESET}`);
    console.log(`  ${DIM}npm install -g ${PACKAGE_NAME}@latest${RESET}`);
    console.log(`  ${DIM}# or${RESET}`);
    console.log(`  ${DIM}bun install -g ${PACKAGE_NAME}@latest${RESET}\n`);
  } else {
    console.log(
      `${GREEN}✓${RESET} You're running a newer version than published!\n`,
    );
  }
}

function getCurrentVersion(): string | null {
  try {
    // First, try to read from nearby package.json (works for local dev and bundled installs)
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const possiblePaths = [
      path.join(__dirname, "..", "..", "package.json"),
      path.join(__dirname, "..", "package.json"),
      path.join(__dirname, "package.json"),
    ];

    for (const pkgPath of possiblePaths) {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.name?.includes("tnt") && pkg.version) {
          return pkg.version;
        }
      }
    }

    // Try to get version from npm list (global install)
    try {
      const globalResult = execSync(
        `npm list -g ${PACKAGE_NAME} --depth=0 --json 2>/dev/null`,
        {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      const globalData = JSON.parse(globalResult);
      if (globalData.dependencies?.[PACKAGE_NAME]?.version) {
        return globalData.dependencies[PACKAGE_NAME].version;
      }
    } catch {
      // Ignore npm list errors
    }

    // Try local node_modules
    try {
      const result = execSync(
        `npm list ${PACKAGE_NAME} --depth=0 --json 2>/dev/null`,
        {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      const data = JSON.parse(result);
      if (data.dependencies?.[PACKAGE_NAME]?.version) {
        return data.dependencies[PACKAGE_NAME].version;
      }
    } catch {
      // Ignore npm list errors
    }

    return null;
  } catch {
    return null;
  }
}

function getLatestVersion(): string | null {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME} version 2>/dev/null`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim() || null;
  } catch {
    return null;
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = latest.split(".").map(Number);
  const currentParts = current.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;

    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}
