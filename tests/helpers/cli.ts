import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const helpersDir = path.dirname(fileURLToPath(import.meta.url));
/** Repository root (parent of tests/) */
export const REPO_ROOT = path.resolve(helpersDir, "../..");
export const CLI_ENTRY = path.join(REPO_ROOT, "src", "index.ts");

export interface TntResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Run the TNT CLI against a working directory via Bun + source entry.
 * Args are command tokens only (no `tnt` / `bun` prefix), e.g. ["init"].
 */
export function runTnt(cwd: string, args: string[]): TntResult {
  const result = spawnSync("bun", [CLI_ENTRY, ...args], {
    cwd,
    encoding: "utf-8",
    env: { ...process.env },
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Create an empty temp directory for isolation. Caller should clean up. */
export function makeTempRepoDir(prefix = "tnt-test-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function writeFile(cwd: string, relativePath: string, content: string) {
  const full = path.join(cwd, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
}

export function readFile(cwd: string, relativePath: string): string {
  return fs.readFileSync(path.join(cwd, relativePath), "utf-8");
}

export function exists(cwd: string, relativePath: string): boolean {
  return fs.existsSync(path.join(cwd, relativePath));
}

export function removeTempDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}
