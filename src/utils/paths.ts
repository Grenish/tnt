import path from "path";

/**
 * Get the .tnt directory path
 */
export function getTntDir(cwd: string = process.cwd()): string {
  return path.join(cwd, ".tnt");
}

/**
 * Format version marker path (contents: "2" for object-model v2).
 */
export function getFormatPath(cwd: string = process.cwd()): string {
  return path.join(getTntDir(cwd), "format");
}
