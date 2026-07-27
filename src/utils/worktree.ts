import fs from "fs";
import path from "path";
import { readObject } from "./store";
import type { FileEntry } from "./types";

function blobContent(hash: string, cwd: string): string | null {
  const obj = readObject(hash, cwd);
  if (!obj || obj.type !== "blob") return null;
  return obj.content;
}

/**
 * Write blobs for target paths and remove paths that exist in `previous`
 * but not in `target` (checkout / stash restore style).
 */
export function restoreFileMap(
  target: Map<string, string>,
  previous: Map<string, string>,
  cwd: string = process.cwd(),
): void {
  for (const [filePath, hash] of target) {
    const content = blobContent(hash, cwd);
    if (content === null) continue;

    const fullPath = path.join(cwd, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
  }

  for (const [filePath] of previous) {
    if (target.has(filePath)) continue;
    const fullPath = path.join(cwd, filePath);
    if (!fs.existsSync(fullPath)) continue;

    fs.unlinkSync(fullPath);

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

export function fileEntriesToMap(files: FileEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of files) {
    map.set(f.path, f.hash);
  }
  return map;
}

export function mapToFileEntries(map: Map<string, string>): FileEntry[] {
  return [...map.entries()]
    .map(([path, hash]) => ({ path, hash }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
