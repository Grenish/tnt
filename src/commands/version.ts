import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";

export function version(): void {
  const currentVersion = getPackageVersion();

  console.log(`\n${BOLD}${CYAN}tnt${RESET} ${currentVersion}\n`);
}

function getPackageVersion(): string {
  try {
    // Try to find package.json relative to this file
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // Check multiple possible locations
    const possiblePaths = [
      path.join(__dirname, "..", "..", "package.json"),
      path.join(__dirname, "..", "package.json"),
      path.join(process.cwd(), "package.json"),
    ];

    for (const pkgPath of possiblePaths) {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.name?.includes("tnt")) {
          return pkg.version || "unknown";
        }
      }
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}
